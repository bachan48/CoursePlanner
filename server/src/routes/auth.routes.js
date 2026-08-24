import express from 'express';
import { register, login, verifyEmail, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../utils/authSchemas.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.get('/verify/:token', verifyEmail);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);

export default router;