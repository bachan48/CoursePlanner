import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import semesterRoutes from './routes/semester.routes.js';
import courseRoutes from './routes/course.routes.js';
import classScheduleRoutes from './routes/classSchedule.routes.js';
import sessionRoutes from './routes/session.routes.js';
import weekRoutes from './routes/week.routes.js';
import sprintRoutes from './routes/sprint.routes.js';
import deliverableRoutes from './routes/deliverable.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/class-schedules', classScheduleRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/weeks', weekRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/deliverables', deliverableRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Course Planner API is running' });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;