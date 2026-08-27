import express from 'express';
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
} from '../controllers/session.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { sessionCreateSchema, sessionUpdateSchema } from '../utils/authSchemas.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getSessions);
router.post('/', validate(sessionCreateSchema), createSession);
router.put('/:id', validate(sessionUpdateSchema), updateSession);
router.delete('/:id', deleteSession);

export default router;
