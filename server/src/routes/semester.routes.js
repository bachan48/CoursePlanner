import express from 'express';
import {
  getSemesters,
  getSemester,
  createSemester,
  updateSemester,
  deleteSemester,
} from '../controllers/semester.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { semesterSchema } from '../utils/authSchemas.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getSemesters);
router.get('/:id', getSemester);
router.post('/', validate(semesterSchema), createSemester);
router.put('/:id', validate(semesterSchema), updateSemester);
router.delete('/:id', deleteSemester);

export default router;
