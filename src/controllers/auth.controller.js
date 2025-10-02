import * as authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export async function login(c) {
  try {
    const { nis, password } = await c.req.json();
    
    // Validate input
    if (!nis || !password) {
      return errorResponse('NIS and password are required', 400);
    }
    
    if (typeof nis !== 'string' || typeof password !== 'string') {
      return errorResponse('NIS and password must be strings', 400);
    }
    
    const result = await authService.authenticateUser(nis, password);
    
    return successResponse(result, 'Login successful');
  } catch (error) {
    console.error('Error in login:', error);
    const status = error.message.includes('Invalid credentials') || 
                   error.message.includes('Account is inactive') ? 401 : 400;
    return errorResponse(error.message, status);
  }
}

export async function getProfile(c) {
  try {
    const user = c.get('user');
    
    if (!user) {
      return errorResponse('User not found in context', 404);
    }
    
    return successResponse(user, 'Profile retrieved successfully');
  } catch (error) {
    console.error('Error in getProfile:', error);
    return errorResponse(error.message, 400);
  }
}