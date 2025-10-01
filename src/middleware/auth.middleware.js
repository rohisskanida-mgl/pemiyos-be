import * as authService from '../services/auth.service.js';
import { errorResponse } from '../utils/response.util.js';

export async function authMiddleware(c, next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      return errorResponse('Authorization header is required', 401);
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return errorResponse('Invalid authorization header format. Use: Bearer <token>', 401);
    }
    
    const token = parts[1];
    
    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Get fresh user data
    const user = await authService.getUserById(decoded.user_id);
    
    // Attach user to context
    c.set('user', user);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    const status = error.message.includes('Invalid or expired token') || 
                   error.message.includes('User not found') ||
                   error.message.includes('Account is inactive') ? 401 : 400;
    return errorResponse(error.message, status);
  }
}

// Optional middleware for admin-only routes
export async function adminMiddleware(c, next) {
  try {
    const user = c.get('user');
    
    if (!user) {
      return errorResponse('Authentication required', 401);
    }
    
    if (user.role !== 'admin') {
      return errorResponse('Admin access required', 403);
    }
    
    await next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return errorResponse(error.message, 403);
  }
}