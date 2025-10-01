import { Hono } from 'hono';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const auth = new Hono();

// Public routes
auth.post('/login', authController.login);

// Protected routes
auth.get('/profile', authMiddleware, authController.getProfile);

export default auth;