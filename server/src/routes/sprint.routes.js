import express from 'express';
import {
  getSprints,
  createSprint,
  updateSprint,
  deleteSprint,
} from '../controllers/sprint.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { sprintSchema } from '../utils/authSchemas.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getSprints);
router.post('/', validate(sprintSchema), createSprint);
router.put('/:id', validate(sprintSchema), updateSprint);
router.delete('/:id', deleteSprint);

export default router;
