import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Course validation schemas
export const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required').max(100, 'Course name is too long'),
  code: z.string().min(1, 'Course code is required').max(20, 'Course code is too long'),
  instructor: z.string().min(1, 'Instructor name is required').max(100, 'Instructor name is too long'),
  credits: z.number().min(1, 'Credits must be at least 1').max(10, 'Credits cannot exceed 10'),
  semester: z.string().min(1, 'Semester is required'),
  description: z.string().optional(),
  color: z.string().optional(),
});

// Deliverable validation schemas
export const deliverableSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  dueDate: z.string().min(1, 'Due date is required'),
  courseId: z.string().min(1, 'Course is required'),
  type: z.enum(['Assignment', 'Exam', 'Project', 'Quiz', 'Other']),
  description: z.string().optional(),
  weight: z.number().min(0).max(100).optional(),
});

// Schedule validation schemas
export const scheduleSlotSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
});

// Validation helper
export const validateForm = (schema, data) => {
  try {
    schema.parse(data);
    return { isValid: true, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.reduce((acc, curr) => {
        const key = curr.path.join('.');
        acc[key] = curr.message;
        return acc;
      }, {});
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

export default {
  registerSchema,
  loginSchema,
  courseSchema,
  deliverableSchema,
  scheduleSlotSchema,
  validateForm,
};