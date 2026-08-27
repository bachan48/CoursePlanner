import express from 'express';
import {
  getClassSchedules,
  createClassSchedule,
  updateClassSchedule,
  deleteClassSchedule,
} from '../controllers/classSchedule.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { classScheduleSchema } from '../utils/authSchemas.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getClassSchedules);
router.post('/', validate(classScheduleSchema), createClassSchedule);
router.put('/:id', validate(classScheduleSchema), updateClassSchedule);
router.delete('/:id', deleteClassSchedule);

export default router;
