# CoursePlanner — System Architecture Document

## 1. System Overview

CoursePlanner is a **full-stack academic planning application** that helps students manage courses, semesters, class schedules, sprints (Agile-style teaching blocks), and deliverables (assignments). It uses a **React SPA frontend** communicating with a **Node.js/Express REST API** backed by **MongoDB** (Mongoose ODM).

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COURSEPLANNER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  FRONTEND (React + Vite)                                     │  │
│  │                                                              │  │
│  │  Pages: CourseList, CourseDetail, WeekPage, Schedule         │  │
│  │       : Login, Register, VerifyEmail, NotFound               │  │
│  │                                                              │  │
│  │  Components: Forms (Course, Semester, Sprint, Session,       │  │
│  │              ClassSchedule, Deliverable), SprintCard, Layout  │  │
│  │                                                              │  │
│  │  State: AuthContext (global) + 7 custom hooks (per-resource) │  │
│  │  UI: TailwindCSS + react-hot-toast                          │  │
│  │  HTTP: Axios with interceptors (auth token, 401 redirect)    │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │ HTTP/JSON                           │
│                             ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  BACKEND (Express.js)                                        │  │
│  │                                                              │  │
│  │  Middleware: CORS → JSON parser → auth.protect (JWT) →       │  │
│  │              zod validation → controller                     │  │
│  │                                                              │  │
│  │  Routes: /api/auth, /api/semesters, /api/courses,           │  │
│  │          /api/class-schedules, /api/sessions, /api/weeks,    │  │
│  │          /api/sprints, /api/deliverables                     │  │
│  │                                                              │  │
│  │  Utils: scheduleGenerator.js (week/session generation logic) │  │
│  │         sendEmail.js (Nodemailer), generateToken.js (JWT)   │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                     │
│                             ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  DATABASE (MongoDB via Mongoose)                              │  │
│  │                                                              │  │
│  │  Collections: User, Semester, Course, ClassSchedule, Week,   │  │
│  │               Session, Sprint, Deliverable                   │  │
│  │                                                              │  │
│  │  Indexes: user-scoped filtering, compound indexes on         │  │
│  │           (user, course), (course, weekNumber), etc.         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Model & Relationships

```
User (1) ───────────────────────────────────────────────────────┐
  │                                                             │
  ├── (1)────────────────────────────────────── Semester (N)    │
  │   │                                                         │
  │   ├── (N)────────────────────────────────── Course (N)      │
  │   │   │                                                     │
  │   │   ├── (N)─────────────────────────── ClassSchedule (N)  │
  │   │   │                                                     │
  │   │   ├── (N)─────────────────────────── Week (N)           │
  │   │   │   │                                                 │
  │   │   │   └── (N)─────────────────────── Session            │
  │   │   │     │                                                 │
  │   │   │     └── classSchedule (nullable, optional override) │
  │   │   │                                                     │
  │   │   ├── (N)─────────────────────────── Sprint             │
  │   │   │   │  (Week ←→ Sprint via Week.sprint ref)          │
  │   │   │   │                                                 │
  │   │   │   └── (N)─────────────────────── Deliverable        │
  │   │   │                                                     │
  │   │   └── (N)─────────────────────────── isDeleted (soft)   │
  │   │                                                         │
  │   └── (N)─────────────────────────── isDeleted (soft)       │
  │                                                             │
  └── (N)──────────────────────────────────────  (all models)  │
     │    user-scoped (every collection has a user FK)          │
     │                                                         │
  └── (N)──────────────────────────────────────  (hashed pwd)  │
```

### Document Schemas

| Model | Key Fields | Indexes |
|-------|-----------|---------|
| **User** | username, email, password (hashed), isVerified, verificationToken | unique: username, email |
| **Semester** | name, startDate, endDate, isDeleted (soft) | user + isDeleted |
| **Course** | title, code, credits, instructor, color, semester, isDeleted | user+isDeleted, user+semester+isDeleted, user+code (unique partial) |
| **ClassSchedule** | type (enum), daysOfWeek[], startTime, endTime, location | user+course |
| **Week** | weekNumber, startDate, endDate, sprint (nullable), notes | course+weekNumber (unique) |
| **Session** | date, type, startTime, endTime, location, speaker, readingMaterials[], activities[], classSchedule, week, isCancelled | user+course+date |
| **Sprint** | name, description | user+course |
| **Deliverable** | title, description, dueDate, sprint | user+course, user+sprint, dueDate |

---

## 3. Module Complexity Ranking

### Module 1: `scheduleGenerator.js` ⭐⭐⭐⭐⭐ (Highest)
**Location:** `server/src/utils/scheduleGenerator.js`

This is the most complex module. It contains all the domain logic for converting semester date ranges and class schedule rules into concrete weeks and session records. It handles DST transitions, Monday-first week numbering, weekend semester starts, and destructive rebuild operations.

**Complexity Drivers:**
- Custom calendar arithmetic (Monday-of-week, Friday-of-week)
- DST-safe day stepping (uses `addDays` with `setDate`, not raw millisecond addition)
- Idempotent week creation (only creates missing weeks)
- Multi-day class rules generating individual sessions
- Destructive regenerate (bulk delete + recreate)

### Module 2: `course.controller.js` ⭐⭐⭐⭐
**Location:** `server/src/controllers/course.controller.js`

Handles the full lifecycle of courses including soft-delete cascades, cross-validation, and the regenerate endpoint that triggers the schedule generator.

**Complexity Drivers:**
- Soft-delete with cascade cleanup (5 collections)
- Cross-model validation (semester existence, code uniqueness)
- Regenerate endpoint orchestrating `scheduleGenerator`
- Partial updates with code uppercasing

### Module 3: `semester.controller.js` ⭐⭐⭐⭐
**Location:** `server/src/controllers/semester.controller.js`

Manages semesters with a complex 409-confirmation pattern for date-range changes that affect child courses. Triggers cascade regeneration across all courses.

**Complexity Drivers:**
- Conditional 409 conflict response with affected-course details
- Bulk regeneration loop over all courses
- Cascade protection (can't delete semester with courses)
- Cross-field validation (endDate > startDate)

### Module 4: `classSchedule.controller.js` ⭐⭐⭐
**Location:** `server/src/controllers/classSchedule.controller.js`

Manages recurring class rules. On create, generates sessions; on update, deletes old sessions and regenerates. This is the primary data-generation endpoint.

**Complexity Drivers:**
- Cross-model join (course → semester)
- Post-create session generation
- Post-update session regeneration (delete-then-recreate pattern)
- Cascade delete on rule deletion

### Module 5: `WeekPage.jsx` ⭐⭐⭐
**Location:** `client/src/pages/WeekPage.jsx`

The most complex client page. Displays a single week with its sessions, deliverables, notes, and navigation between weeks. Manages inline session editing.

**Complexity Drivers:**
- Multi-source data (week from API, sessions + deliverables from week detail)
- State synchronization (notes ↔ week.notes)
- Conditional week ID resolution (finds weekId by weekNumber)
- Inline session CRUD (create/edit/delete + modal form)
- Week navigation with boundary checks

---

## 4. Request Flow Architecture

### A. Creating a Course (Full Chain)

```
Client                          Server                        Database
  │                               │                              │
  │── POST /api/courses ─────────►│                              │
  │   { semester, title, ... }    │                              │
  │                               │── GET Semester.find() ──────►│
  │                               │◄── semester doc ─────────────│
  │                               │── GET Course.find(unique) ──►│
  │                               │◄── no conflict ──────────────│
  │                               │── POST Course.create() ─────►│
  │                               │◄── new course doc ───────────│
  │                               │── GET Course.findById().populate──►│
  │◄── { success, data } ─────────│                              │
  │                               │                              │
  │  (no weeks yet; weeks auto-generate on class schedule add)  │
```

### B. Class Schedule → Weeks → Sessions (Auto-Generation)

```
Client                          Server                        Database
  │                               │                              │
  │── POST /api/class-schedules ─►│                              │
  │   { course, type, days, ... } │                              │
  │                               │── GET course + semester ───►│
  │                               │                              │
  │                               │── POST ClassSchedule.create()
  │                               │                              │
  │                               │── generateSessionsForClassSchedule()
  │                               │    │
  │                               │    ├── ensureWeeksForCourse()
  │                               │    │    │ (computes Mon-Fri weeks)
  │                               │    │    │── Week.insertMany()
  │                               │    │
  │                               │    └── For each calendar day:
  │                               │         │ (day matches rule?)
  │                               │         ├── Session.insertMany()
  │                               │
  │◄── { success, data, sessionsCreated } ◄│
```

### C. JWT Authentication Flow

```
Client                    Server                    MongoDB
  │                         │                         │
  │── POST /api/auth/register ─►                     │
  │── POST /api/auth/login ───►                     │
  │                         │── User.findOne() ──────►│
  │                         │── bcrypt.compare()     │
  │                         │                         │
  │◄── { token, user } ─────│                         │
  │  (stored in localStorage)                         │
  │                         │                         │
  │── GET /api/...          │                         │
  │   Authorization: Bearer <token>                  │
  │                         │── JWT.verify()          │
  │                         │── User.findById() ─────►│
  │                         │── req.user set          │
  │◄── { data } ────────────│                         │
```

---

## 5. Client-Side Architecture

```
App.jsx (Routes)
  │
  ├── AuthProvider (context)
  │     ├── login / register / logout / updateUser
  │     └── Stores: user, token in localStorage
  │
  ├── Pages:
  │     ├── CourseList → useSemesters + useCourses
  │     ├── CourseDetail → useClassSchedules + useSprints + useWeeks
  │     ├── WeekPage → useWeekDetail + useWeeks
  │     ├── Schedule → (empty page)
  │     └── Auth pages (Login, Register, VerifyEmail)
  │
  ├── Hooks (all follow same pattern:
  │        useState + useCallback + useEffect = fetch → set state):
  │     ├── useSemesters
  │     ├── useCourses
  │     ├── useClassSchedules
  │     ├── useSprints
  │     ├── useWeeks
  │     ├── useWeekDetail (fetches week + sessions + deliverables)
  │     └── useDeliverables
  │
  └── Services:
        └── api.js (Axios instance with auth interceptors)
```

### Hook Pattern (repeated 7 times)

```javascript
const useEntity = (id) => {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => { /* API call → setState */ }, [id]);

  const create = useCallback(async (data) => { /* API + optimistic update */ }, []);
  const update = useCallback(async (id, data) => { /* API + optimistic update */ }, []);
  const remove = useCallback(async (id) => { /* API + optimistic filter */ }, []);

  useEffect(() => { fetch(); }, [fetch]); // Auto-fetch on mount/id change

  return { entities, loading, error, fetch, create, update, remove };
};
```

---

## 6. Refactoring Opportunities

### 6.1 Extract Schedule Generation into a Service Class

**Problem:** `scheduleGenerator.js` has ~110 lines of calendar math + DB operations mixed together. `ensureWeeksForCourse`, `generateSessionsForClassSchedule`, and `regenerateWeeksAndSessionsForCourse` all perform both computation and DB mutations.

**Current code:**
```javascript
export const ensureWeeksForCourse = async ({ userId, courseId, semester }) => {
  const semStart = startOfDay(semester.startDate);
  const semEnd = startOfDay(semester.endDate);
  const firstMonday = firstTeachingMonday(semStart);
  // ... 20+ lines of calendar math ...
  const existingWeeks = await Week.find({ course: courseId }).sort({ weekNumber: 1 });
  // ... mixed computation + DB ...
};
```

**Suggested refactor:**
```javascript
// services/ScheduleEngine.js — pure calendar computation
class ScheduleEngine {
  static computeWeekRange(semester) { /* ...pure math, no DB... */ }
  static computeWeeks(semester, existingWeekNumbers) { /* returns week specs */ }
  static computeSessions(classSchedule, weeks, defaultSpeaker) { /* returns session specs */ }
}

// services/SchedulePersister.js — DB-only operations
class SchedulePersister {
  static async ensureWeeks(userId, courseId, weeksToCreate) { /* insertMany */ }
  static async generateSessions(userId, courseId, sessionsToCreate) { /* insertMany */ }
  static async deleteSessionsByCourse(userId, courseId) { /* deleteMany */ }
}

// services/ScheduleGenerator.js — orchestrator
export const generateSessionsForClassSchedule = async (opts) => {
  const weekSpecs = ScheduleEngine.computeWeeks(opts.semester, existingWeekNumbers);
  await SchedulePersister.ensureWeeks(opts.userId, opts.courseId, weekSpecs);
  // ...
};
```

### 6.2 Deduplicate Controller Validation Logic

**Problem:** Every controller repeats the same pattern:
```javascript
const model = await Model.findOne({ _id: req.params.id, user: req.user.id });
if (!model) return res.status(404).json({ success: false, message: 'Not found' });
// ... do work ...
```

**Suggested refactor:**
```javascript
// middleware/requireOwned.js
export const requireOwned = (Model, ...populateFields) => async (req, res, next) => {
  const doc = await Model.findOne({ _id: req.params.id, user: req.user.id })
    .populate(populateFields);
  if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
  req.doc = doc;
  next();
};

// Usage in controllers:
router.get('/:id', requireOwned(Sprint), (req, res) => {
  res.json({ success: true, data: req.doc });
});
```

### 6.3 Consolidate Zod Schemas into a Single Module

**Problem:** `authSchemas.js` contains all validation schemas despite not being auth-specific. It's misnamed and hard to maintain.

**Suggested refactor:**
```javascript
// utils/schemas/index.js
export { registerSchema, loginSchema } from './auth.js';
export { semesterSchema } from './semester.js';
export { courseSchema } from './course.js';
// etc.
```

### 6.4 Fix API Token Interceptor Bug

**Problem:** `client/src/services/api.js` line with token concatenation is syntactically broken — the template literal is truncated:

```javascript
// BROKEN (current code):
config.headers.Authorization = `******;
```

**Suggested fix:**
```javascript
// FIXED:
config.headers.Authorization = `Bearer ${token}`;
```

This is a **blocking bug** — the app cannot make authenticated requests.

### 6.5 Extract Modal Components

**Problem:** Three pages (CourseList, CourseDetail, WeekPage) each define inline modals (CourseForm, ClassScheduleForm, SprintForm) with identical wrapper structure:
```jsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
  <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
    <div className="p-6 border-b">...</div>
    <div className="p-6"><FormComponent ... /></div>
  </div>
</div>
```

**Suggested refactor:**
```jsx
// components/ui/Modal.jsx (already exists! but unused for these cases)
<Modal
  title="Edit Course"
  onClose={() => setShowEditCourse(false)}
>
  <CourseForm initialData={course} semesters={semesters} onSubmit={handleUpdateCourse} onCancel={() => setShowEditCourse(false)} />
</Modal>
```

### 6.6 Add Error Boundary to Client

**Problem:** No React ErrorBoundary exists. A crash in any child component unmounts the entire app without recovery.

**Suggested addition:**
```jsx
// components/ui/ErrorBoundary.jsx
import { Component } from 'react';
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <NotFound />;
    return this.props.children;
  }
}
```

### 6.7 Backend: Add Transaction Support for Cascade Operations

**Problem:** `course.controller.js` delete uses `Promise.all` for concurrent deletes — if one fails, partial cleanup leaves orphan records:

```javascript
// Current (racy):
await Promise.all([
  Session.deleteMany(filter),
  ClassSchedule.deleteMany(filter),
  // ...
]);
```

**Suggested refactor:**
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Session.deleteMany(filter, { session });
  await ClassSchedule.deleteMany(filter, { session });
  // ...
  await course.save({ session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

### 6.8 Frontend: Memoize Derived Data

**Problem:** `CourseList.jsx` recomputes `coursesBySemester` on every render:
```javascript
const coursesBySemester = (semesterId) => courses.filter(
  (c) => (c.semester?._id || c.semester) === semesterId
);
```

**Suggested fix:**
```javascript
const coursesBySemester = useMemo(
  (semId) => courses.filter((c) => (c.semester?._id || c.semester) === semId),
  [courses]
);
```

---

## 7. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Soft delete via `isDeleted`** | Semester + Course use soft delete; Session/Week/Sprint/Deliverable use hard delete |
| **User-scoped data** | Every collection has a `user` FK; all queries filter by `req.user.id` |
| **ClassSchedule → Session pattern** | Recurring rules (ClassSchedule) generate concrete instances (Session); manual overrides possible via classSchedule:null |
| **Week ↔ Sprint via nullable ref** | Weeks are auto-generated; Sprints are manual. Assign via bulk update. |
| **Zod validation at middleware layer** | Validates before controller; returns structured errors |
| **UTC midnight calendar dates** | Dates stored as UTC midnight; `formatters.js` has `toCalendarDate()` to avoid timezone shifts |
| **DST-aware date math** | Uses `setDate()` not millisecond addition to prevent drift across DST transitions |
| **No pagination** | All list endpoints return full datasets (acceptable for small user data) |

**Hierarchical flow:** `Semester` → `Sprint` → `Week` → `Session` / `ClassSchedule`

| Model            | Collection         | Key Fields | Relationships |
|------------------|--------------------|------------|---------------|
| `Semester`       | semesters          | `course`, `semester`, `year`, `sprints[]` | Root node; contains Sprint IDs |
| `Sprint`         | sprints            | `name`, `startDate`, `endDate`, `weeks[]` | Belongs to a Semester via `course` field |
| `Week`           | weeks              | `number`, `startDate`, `endDate`, `sprint` | Belongs to a Sprint; contains Session & ClassSchedule IDs |
| `Session`        | sessions           | `title`, `description`, `week`, `sessionType`, `sessionNumber` | References a specific Week |
| `ClassSchedule`  | classSchedules     | `day`, `startTime`, `endTime`, `location`, `week` | References a specific Week |
| `Deliverable`    | deliverables       | `title`, `dueDate`, `description`, `sprint`, `type`, `weight` | Belongs to a Sprint (assignments, quizzes, exams, project milestones) |

**Relationship semantics:**
- Each `Semester` represents a full course term (e.g., "Fall 2025 - CS101").
- A `Semester` is divided into `Sprint`s (typically 2–4 week cycles).
- Each `Sprint` contains multiple `Week`s, which are numbered sequentially.
- Each `Week` contains `Session`s (lecture/discussion activities) and `ClassSchedule`s (recurring meeting times like "Mon/Wed 10:00–11:30").
- `Deliverable`s are scoped to a `Sprint` and represent all assessments within that sprint (assignments, quizzes, midterms, final exam, project milestones).

**Referential integrity:**
- All child models store a reference to their parent `Semester` via the `course` field (which holds the Semester's `_id`).
- `Session` and `ClassSchedule` reference their `Week` via the `week` field.
- `Week` references its owning `Sprint` via the `sprint` field.
- `Deliverable` references its owning `Sprint` via the `sprint` field.

### Backend Route & Middleware Structure

The Express app (`server/src/app.js`) centralizes all middleware configuration and route mounting:

**Middleware pipeline (in order):**
1. `cors` — enables cross-origin requests from the frontend dev server
2. `express.json()` / `express.urlencoded()` — parse JSON and URL-encoded request bodies
3. `helmet` — secure HTTP headers (XSS protection, HSTS, etc.)
4. `compression` — gzip/deflate response compression
5. `mongoose.connect()` — persistent MongoDB connection at startup
6. Custom `routes` — mounted Express router with all API endpoints

**Route organization:**
- All API endpoints are under the `/api` base path.
- Routes are organized by resource (`/api/semesters`, `/api/sprints`, `/api/weeks`, `/api/sessions`, `/api/class-schedules`, `/api/deliverables`).
- Each resource supports standard CRUD operations (GET, POST, PUT, DELETE).
- Query parameters enable filtering by parent (`?course=semesterId`, `?sprint=sprintId`, `?week=weekId`).
- The `week` resource provides a special `getDetail` endpoint that returns a week with its nested `sessions` and `deliverables` in a single response.

**Request lifecycle for a typical endpoint:**
```
Client Request → CORS Check → Body Parsing → Helmet Headers → Route Matching
  → Controller Logic → Model Query (Mongoose) → Response Serialization → Compression
```
## Frontend Architecture

### Custom Hook Pattern (State Management)

The frontend replaces global state managers (Redux, Zustand) with a collection of **resource-specific custom hooks**. Each hook encapsulates:
- **State:** `data` (loaded records), `loading`, `error`
- **Fetch logic:** `fetch` methods that call the API service layer
- **CRUD operations:** Synchronous optimistic updates on successful API responses
- **Synchronization:** State is updated only after the server confirms the operation (POST, PUT, DELETE)

| Hook | Resource | Fetch Method | CRUD Methods |
|------|----------|-------------|--------------|
| `useSemesters` | Semesters | `fetchSemesters(course)` | `add`, `update`, `delete` |
| `useSprints` | Sprints | `fetchSprints(semesterId)` | `add`, `update`, `delete` |
| `useWeeks` | Weeks | `fetchWeeks(sprintId)` | `add`, `update`, `delete` |
| `useWeekDetail` | Weeks (detailed) | `fetchWeekDetail(semesterId, weekId)` | `addSession`, `deleteSession`, `updateSession`, `addDeliverable`, `deleteDeliverable`, `updateDeliverable` |
| `useClassSchedules` | Class Schedules | `fetchClassSchedules(semesterId)` | `add`, `update`, `delete` |
| `useDeliverables` | Deliverables | `fetchDeliverables(sprintId)` | `add`, `update`, `delete` |

**Hook lifecycle pattern:**
```
Component mounts → Hook calls API service → Sets loading=true → Fetch data → Sets data + loading=false
  → User triggers action (add/update/delete) → Hook calls API service → On success: update local state synchronously → On error: set error state
```

**Optimistic updates:**
When a POST, PUT, or DELETE succeeds, the hook immediately updates the local `data` state with the server-confirmed result. This provides instant UI feedback without waiting for the next component re-render cycle from a separate store update.

### API Service Layer

The service layer (`client/src/services/api.js`) is a thin abstraction over native `fetch`:
- Imports a base `API_URL` from environment variables (`import.meta.env.VITE_API_URL`)
- Exports resource-specific functions that construct fetch calls with appropriate HTTP methods, headers (`Content-Type: application/json`), and URL paths
- Each function returns a Promise that resolves with the JSON response body
- Errors are caught and re-thrown for hooks to handle

**Endpoint mapping (service → HTTP → route):**

| Service Function | HTTP | API Endpoint | Purpose |
|-----------------|------|-------------|---------|
| `getSemesters` | GET | `/api/semesters?course=...` | List semesters |
| `addSemester` | POST | `/api/semesters` | Create semester |
| `updateSemester` | PUT | `/api/semesters/:id` | Update semester |
| `deleteSemester` | DELETE | `/api/semesters/:id` | Delete semester |
| `getSprints` | GET | `/api/sprints?course=...` | List sprints |
| `getWeeks` | GET | `/api/weeks?sprint=...` | List weeks |
| `getWeekDetail` | GET | `/api/weeks/:weekId/detail?semesterId=...` | Get week + sessions + deliverables |
| `getDeliverables` | GET | `/api/deliverables?sprint=...` | List deliverables |

### UI Component Structure

The UI follows a **container/presenter pattern** mediated by custom hooks:

```
App (Router)
├── CourseSelector (selects active semester/course)
├── Dashboard (high-level course overview)
│   └── SemesterDetail (uses useClassSchedules, useWeeks, useSprints)
│       ├── SprintView (uses useWeeks, useDeliverables)
│       │   ├── WeekGrid (uses useWeekDetail)
│       │   │   ├── SessionList / SessionForm
│       │   │   └── DeliverableList / DeliverableForm
│       │   └── SprintDeliverables
│       └── SprintForm / WeekForm / SessionForm (inline edit forms)
```

**Data flow (one-way):**
```
Component renders → Custom Hook fetches data → API Service → Fetch → Backend Route → Controller → Mongoose → Response
  → Hook receives response → Updates local state → Component re-renders with data
```

**Component-to-hook communication:**
- Components **do not** call API directly; they delegate all data operations to their hook.
- Components receive data and action functions as hook return values.
- Forms trigger hook methods (e.g., `addWeek`, `updateSession`), which handle the API call and state synchronization.

### Vite Configuration

- **Dev server:** Runs on port 5173 (default), proxies `/api` requests to `http://localhost:5000` to avoid CORS issues during development.
- **Build:** Targets modern browsers, produces optimized production bundles in `dist/`.
- **Plugins:** React Refresh plugin for hot module replacement during development.

### TypeScript Usage

The frontend uses TypeScript throughout:
- Components: `.tsx` files with explicit prop interfaces
- Services: `.ts` files with typed request/response interfaces
- Hooks: `.tsx` files with typed state and action return values