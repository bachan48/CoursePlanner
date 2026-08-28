# CoursePlanner - Architecture Documentation

## Tech Stack

### Frontend
- **Framework:** React 18+ with Vite (build tool)
- **Language:** TypeScript
- **Styling:** CSS Modules / Tailwind (as configured)
- **State Management:** React Context API + `useReducer` (client-side), Zustand or Redux (if installed)
- **Data Fetching:** native `fetch` with custom hooks, or `axios` / `react-query`
- **Routing:** `react-router-dom` v6+
- **UI Components:** Custom components with functional + class components

### Backend
- **Framework:** Node.js + Express.js
- **Language:** TypeScript or JavaScript
- **Database:** MongoDB via Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) + bcryptjs for password hashing
- **Middleware:** cors, express-validator, dotenv, mongoose
- **File Handling:** Multer for file uploads

## Environment Configuration

### Backend (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/courseplanner
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:5000/api
```
## Backend Architecture

### Mongoose Model Hierarchy

The database schema enforces a strict hierarchical structure representing the lifecycle of a course:

```
Semester
├── Sprints (array of ObjectId → Sprint)
│   ├── Weeks (array of ObjectId → Week)
│   │   ├── Sessions (array of ObjectId → Session)
│   │   └── ClassSchedules (array of ObjectId → ClassSchedule)
│   └── Deliverables (array of ObjectId → Deliverable)
└── (direct) Weeks, Sessions, ClassSchedules also reference Semester via `course` field
```

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