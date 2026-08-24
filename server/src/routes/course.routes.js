import express from 'express';
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStats,
} from '../controllers/course.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { courseSchema } from '../utils/authSchemas.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getCourses);
router.get('/stats', getCourseStats);
router.get('/:id', getCourse);
router.post('/', validate(courseSchema), createCourse);
router.put('/:id', validate(courseSchema), updateCourse);
router.delete('/:id', deleteCourse);

export default router;