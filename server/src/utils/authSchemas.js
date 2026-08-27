import { z } from 'zod';

const DAY_ENUM = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CLASS_TYPE_ENUM = ['lecture', 'lab', 'tutorial'];

export const registerSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters'),
    email: z
      .string()
      .email('Please provide a valid email'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Please provide a valid email'),
    password: z
      .string()
      .min(1, 'Password is required'),
  }),
});

export const semesterSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Semester name is required').max(50, 'Semester name cannot exceed 50 characters'),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
    // Only meaningful on update - confirms the caller accepted the week/session
    // regeneration warning when changing dates on a semester with existing weeks.
    confirmRegenerate: z.boolean().optional(),
  }),
});

export const courseSchema = z.object({
  body: z.object({
    semester: z.string().min(1, 'Semester is required'),
    title: z
      .string()
      .min(1, 'Course title is required')
      .max(150, 'Title cannot exceed 150 characters'),
    code: z
      .string()
      .min(1, 'Course code is required')
      .regex(/^[A-Z]{2,6}\d{2,4}[A-Z]?$/i, 'Please provide a valid course code (e.g., CS101, SENG480B)'),
    credits: z
      .number()
      .min(0, 'Credits must be a positive number')
      .max(20, 'Credits cannot exceed 20'),
    instructor: z.string().max(100, 'Instructor name cannot exceed 100 characters').optional().default(''),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().default(''),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional().default('#4F46E5'),
  }),
});

export const classScheduleSchema = z.object({
  body: z.object({
    course: z.string().min(1, 'Course reference is required'),
    type: z.enum(CLASS_TYPE_ENUM),
    daysOfWeek: z.array(z.enum(DAY_ENUM)).min(1, 'Select at least one day of the week'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    location: z.string().max(100, 'Location cannot exceed 100 characters').optional().default(''),
  }),
});

export const sessionUpdateSchema = z.object({
  body: z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }).optional(),
    type: z.enum(CLASS_TYPE_ENUM).optional(),
    startTime: z.string().min(1).optional(),
    endTime: z.string().min(1).optional(),
    location: z.string().max(100).optional(),
    speaker: z.string().max(150, 'Speaker name cannot exceed 150 characters').optional(),
    readingMaterials: z.array(z.string().max(300, 'Reading material entry is too long')).optional(),
    activities: z.array(z.string().max(300, 'Activity entry is too long')).optional(),
    isCancelled: z.boolean().optional(),
  }),
});

export const sessionCreateSchema = z.object({
  body: z.object({
    course: z.string().min(1, 'Course reference is required'),
    week: z.string().min(1, 'Week reference is required'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
    type: z.enum(CLASS_TYPE_ENUM),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    location: z.string().max(100).optional().default(''),
    speaker: z.string().max(150).optional().default(''),
    readingMaterials: z.array(z.string().max(300)).optional().default([]),
    activities: z.array(z.string().max(300)).optional().default([]),
  }),
});

export const weekUpdateSchema = z.object({
  body: z.object({
    notes: z.string().max(4000, 'Notes cannot exceed 4000 characters').optional(),
    sprint: z.string().nullable().optional(),
  }),
});

export const weekAssignSprintSchema = z.object({
  body: z.object({
    weekIds: z.array(z.string()).min(1, 'Select at least one week'),
    sprint: z.string().nullable(),
  }),
});

export const sprintSchema = z.object({
  body: z.object({
    course: z.string().min(1, 'Course reference is required'),
    name: z.string().min(1, 'Sprint name is required').max(100, 'Sprint name cannot exceed 100 characters'),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().default(''),
  }),
});

export const deliverableSchema = z.object({
  body: z.object({
    sprint: z.string().min(1, 'Sprint reference is required'),
    course: z.string().min(1, 'Course reference is required'),
    title: z
      .string()
      .min(1, 'Deliverable title is required')
      .max(200, 'Title cannot exceed 200 characters'),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().default(''),
    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
  }),
});

// Editing a deliverable only ever changes its own fields - sprint/course are
// set at creation and never resent by the edit form, so they aren't required here.
export const deliverableUpdateSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Deliverable title is required')
      .max(200, 'Title cannot exceed 200 characters')
      .optional(),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional(),
    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' })
      .optional(),
  }),
});
