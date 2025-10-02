import { Hono } from 'hono';
import * as StatisticController from '../controllers/statistic.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const statistic = new Hono();

// Protect statistic routes with authentication
statistic.use('*', authMiddleware);

statistic.get('/votes/:position_id', StatisticController.getVoteStats);

export default statistic;