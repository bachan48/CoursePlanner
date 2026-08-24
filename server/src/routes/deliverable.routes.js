import express from 'express';
import {
  getDeliverables,
  getDeliverable,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
  getUpcomingDeliverables,
} from '../controllers/deliverable.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { deliverableSchema } from '../utils/authSchemas.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getDeliverables);
router.get('/upcoming', getUpcomingDeliverables);
router.get('/:id', getDeliverable);
router.post('/', validate(deliverableSchema), createDeliverable);
router.put('/:id', validate(deliverableSchema), updateDeliverable);
router.delete('/:id', deleteDeliverable);

export default router;