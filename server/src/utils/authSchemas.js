import { z } from 'zod';

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

export const courseSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Course title is required')
      .max(150, 'Title cannot exceed 150 characters'),
    code: z
      .string()
      .min(1, 'Course code is required')
      .regex(/^[A-Z]{2,6}\d{2,4}$/, 'Please provide a valid course code (e.g., CS101, MATH201)'),
    credits: z
      .number()
      .min(0, 'Credits must be a positive number')
      .max(20, 'Credits cannot exceed 20'),
    instructor: z.string().max(100, 'Instructor name cannot exceed 100 characters').optional().default(''),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().default(''),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional().default('#4F46E5'),
    semester: z.string().max(50, 'Semester cannot exceed 50 characters').optional().default(''),
    days: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])).default([]),
    timeSlots: z.array(
      z.object({
        start: z.string(),
        end: z.string(),
      })
    ).default([]),
  }),
});

export const deliverableSchema = z.object({
  body: z.object({
    course: z
      .string()
      .min(1, 'Course reference is required'),
    title: z
      .string()
      .min(1, 'Deliverable title is required')
      .max(200, 'Title cannot exceed 200 characters'),
    type: z.enum(['assignment', 'quiz', 'exam', 'project', 'lab', 'other']),
    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().default(''),
    weight: z
      .number()
      .min(0, 'Weight must be a positive number')
      .max(100, 'Weight cannot exceed 100')
      .optional()
      .default(0),
  }),
});

export const scheduleSchema = z.object({
  body: z.object({
    course: z
      .string()
      .min(1, 'Course reference is required'),
    day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    location: z.string().max(100, 'Location cannot exceed 100 characters').optional().default(''),
    type: z
      .enum(['lecture', 'lab', 'tutorial', 'seminar', 'other'])
      .optional()
      .default('lecture'),
  }),
});