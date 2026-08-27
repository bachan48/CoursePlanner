import express from 'express';
import {
  getDeliverables,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
} from '../controllers/deliverable.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { deliverableSchema, deliverableUpdateSchema } from '../utils/authSchemas.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getDeliverables);
router.post('/', validate(deliverableSchema), createDeliverable);
router.put('/:id', validate(deliverableUpdateSchema), updateDeliverable);
router.delete('/:id', deleteDeliverable);

export default router;
