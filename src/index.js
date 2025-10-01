import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { connectDatabase } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import crudRoutes from './routes/crud.routes.js';
import { successResponse, errorResponse } from './utils/response.util.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URLs
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Global error handler
app.onError((err, c) => {
  console.error('Global error:', err);
  return errorResponse('Internal server error', 500);
});

// Health check endpoint
app.get('/health', (c) => {
  return successResponse({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }, 'Service is healthy');
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api', crudRoutes);

// 404 handler
app.notFound((c) => {
  return errorResponse('Endpoint not found', 404);
});

// Initialize database connection and start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('🚀 Database connected successfully');
    
    // Start server
    const port = process.env.PORT || 3000;
    console.log(`🌟 Server starting on port ${port}`);
    
    return app;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Export for serverless or module usage
export default app;

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}