import express from 'express';
import {
  getWeeks,
  getWeek,
  updateWeek,
  assignSprintToWeeks,
} from '../controllers/week.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { weekUpdateSchema, weekAssignSprintSchema } from '../utils/authSchemas.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getWeeks);
router.put('/assign-sprint', validate(weekAssignSprintSchema), assignSprintToWeeks);
router.get('/:id', getWeek);
router.put('/:id', validate(weekUpdateSchema), updateWeek);

export default router;
