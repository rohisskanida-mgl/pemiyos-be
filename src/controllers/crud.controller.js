import * as crudService from '../services/crud.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

// Valid collection names
const VALID_COLLECTIONS = ['users', 'positions', 'candidates', 'votes', 'elections'];

function validateCollectionName(collection_name) {
  if (!VALID_COLLECTIONS.includes(collection_name)) {
    throw new Error(`Invalid collection name. Valid collections: ${VALID_COLLECTIONS.join(', ')}`);
  }
}

export async function getAll(c) {
  try {
    const collection_name = c.req.param('collection_name');
    validateCollectionName(collection_name);
    
    const query_params = {
      search: c.req.query('search'),
      limit: c.req.query('limit') || 10,
      is_count: c.req.query('is_count') === 'true',
      page: parseInt(c.req.query('page')) || 1
    };
    
    // Add any additional query parameters as filters
    const allQueries = c.req.queries();
    Object.keys(allQueries).forEach(key => {
      if (!['search', 'limit', 'is_count', 'page'].includes(key)) {
        query_params[key] = allQueries[key];
      }
    });
    
    const result = await crudService.findAll(collection_name, query_params);
    
    if (query_params.is_count) {
      return successResponse(result, 'Count retrieved successfully');
    }
    
    if (result.pagination) {
      return successResponse(result.data, 'Data retrieved successfully', result.pagination);
    }
    
    return successResponse(result.data, 'Data retrieved successfully');
  } catch (error) {
    console.error('Error in getAll:', error);
    return errorResponse(error.message, 400);
  }
}

export async function getById(c) {
  try {
    const collection_name = c.req.param('collection_name');
    const id = c.req.param('id');
    
    validateCollectionName(collection_name);
    
    if (!id) {
      return errorResponse('ID parameter is required', 400);
    }
    
    const result = await crudService.findById(collection_name, id);
    return successResponse(result, 'Data retrieved successfully');
  } catch (error) {
    console.error('Error in getById:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    return errorResponse(error.message, status);
  }
}

export async function create(c) {
  try {
    const collection_name = c.req.param('collection_name');
    validateCollectionName(collection_name);
    
    const data = await c.req.json();
    
    if (!data || Object.keys(data).length === 0) {
      return errorResponse('Request body is required', 400);
    }
    
    // Special handling for votes - check constraint
    if (collection_name === 'votes') {
      const { user_id, position_id, period_start, period_end } = data;
      if (user_id && position_id && period_start && period_end) {
        const hasExistingVote = await crudService.checkVoteConstraint(
          user_id, position_id, period_start, period_end
        );
        if (hasExistingVote) {
          return errorResponse('User has already voted for this position in this period', 409);
        }
      }
    }
    
    const result = await crudService.create(collection_name, data);
    return successResponse(result, 'Data created successfully', null);
  } catch (error) {
    console.error('Error in create:', error);
    const status = error.message.includes('Duplicate entry') ? 409 : 400;
    return errorResponse(error.message, status);
  }
}

export async function update(c) {
  try {
    const collection_name = c.req.param('collection_name');
    const id = c.req.param('id');
    
    validateCollectionName(collection_name);
    
    if (!id) {
      return errorResponse('ID parameter is required', 400);
    }
    
    const data = await c.req.json();
    
    if (!data || Object.keys(data).length === 0) {
      return errorResponse('Request body is required', 400);
    }
    
    const result = await crudService.update(collection_name, id, data);
    return successResponse(result, 'Data updated successfully');
  } catch (error) {
    console.error('Error in update:', error);
    const status = error.message.includes('not found') ? 404 : 
                   error.message.includes('Duplicate entry') ? 409 : 400;
    return errorResponse(error.message, status);
  }
}

export async function softDelete(c) {
  try {
    const collection_name = c.req.param('collection_name');
    const id = c.req.param('id');
    
    validateCollectionName(collection_name);
    
    if (!id) {
      return errorResponse('ID parameter is required', 400);
    }
    
    const result = await crudService.softDelete(collection_name, id);
    return successResponse(null, result.message);
  } catch (error) {
    console.error('Error in softDelete:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    return errorResponse(error.message, status);
  }
}