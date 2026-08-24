import express from 'express';
import {
  getSchedule,
  getScheduleItem,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  getWeeklySchedule,
} from '../controllers/schedule.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { scheduleSchema } from '../utils/authSchemas.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getSchedule);
router.get('/weekly', getWeeklySchedule);
router.get('/:id', getScheduleItem);
router.post('/', validate(scheduleSchema), createScheduleItem);
router.put('/:id', validate(scheduleSchema), updateScheduleItem);
router.delete('/:id', deleteScheduleItem);

export default router;