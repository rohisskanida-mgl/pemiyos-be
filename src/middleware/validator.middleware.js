import { errorResponse } from '../utils/response.util.js';

export function validateJson(c, next) {
  return async () => {
    try {
      const contentType = c.req.header('content-type');
      if (contentType && contentType.includes('application/json')) {
        const body = await c.req.json();
        c.set('validatedBody', body);
      }
      await next();
    } catch (error) {
      return errorResponse('Invalid JSON in request body', 400);
    }
  };
}

export function requireFields(requiredFields) {
  return async (c, next) => {
    try {
      const body = await c.req.json();
      const missingFields = [];
      
      for (const field of requiredFields) {
        if (!body[field] && body[field] !== 0 && body[field] !== false) {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        return errorResponse(`Missing required fields: ${missingFields.join(', ')}`, 400);
      }
      
      await next();
    } catch (error) {
      return errorResponse('Invalid request body', 400);
    }
  };
}