import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';

// Import all models to get their searchable fields and validation functions
import * as usersModel from '../models/users.model.js';
import * as positionsModel from '../models/positions.model.js';
import * as candidatesModel from '../models/candidates.model.js';
import * as votesModel from '../models/votes.model.js';
import * as electionsModel from '../models/elections.model.js';

const models = {
  users: usersModel,
  positions: positionsModel,
  candidates: candidatesModel,
  votes: votesModel,
  elections: electionsModel
};

function getModel(collection_name) {
  const model = models[collection_name];
  if (!model) {
    throw new Error(`Model for collection '${collection_name}' not found`);
  }
  return model;
}

function buildSearchQuery(collection_name, search) {
  if (!search) return {};
  
  const model = getModel(collection_name);
  const searchableFields = model.searchableFields || [];
  
  if (searchableFields.length === 0) return {};
  
  const searchRegex = { $regex: search, $options: 'i' };
  return {
    $or: searchableFields.map(field => ({ [field]: searchRegex }))
  };
}

function addTimestamps(data, isUpdate = false) {
  const now = new Date();
  
  if (!isUpdate) {
    data.created_at = now;
  }
  data.updated_at = now;
  
  return data;
}

function convertObjectIds(data) {
  const converted = { ...data };
  
  // Convert string IDs to ObjectId for fields ending with '_id' (except position_id)
  Object.keys(converted).forEach(key => {
    if (key.endsWith('_id') && key !== 'position_id' && typeof converted[key] === 'string') {
      try {
        converted[key] = new ObjectId(converted[key]);
      } catch (e) {
        // Keep as string if conversion fails
      }
    }
  });
  
  return converted;
}

export async function findAll(collection_name, query_params = {}) {
  try {
    const db = getDatabase();
    const collection = db.collection(collection_name);
    
    const {
      search,
      limit = 10,
      is_count = false,
      page = 1,
      ...filters
    } = query_params;
    
    // Build query
    let query = { deleted_at: { $exists: false } };
    
    // Add search query
    const searchQuery = buildSearchQuery(collection_name, search);
    if (Object.keys(searchQuery).length > 0) {
      query = { ...query, ...searchQuery };
    }
    
    // Add additional filters
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        query[key] = filters[key];
      }
    });
    
    // If only count is requested
    if (is_count) {
      const total = await collection.countDocuments(query);
      return { count: total };
    }
    
    // Handle pagination
    let cursor = collection.find(query);
    
    if (limit !== 'no_limit') {
      const limitNum = Math.min(parseInt(limit) || 10, 100); // Max 100 items
      const skip = (page - 1) * limitNum;
      
      cursor = cursor.skip(skip).limit(limitNum);
      
      // Get total count for pagination
      const total = await collection.countDocuments(query);
      const totalPages = Math.ceil(total / limitNum);
      
      const results = await cursor.toArray();
      
      return {
        data: results,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: total,
          per_page: limitNum
        }
      };
    }
    
    // No limit case
    const results = await cursor.toArray();
    return { data: results };
    
  } catch (error) {
    throw new Error(`Failed to fetch ${collection_name}: ${error.message}`);
  }
}

export async function findById(collection_name, id) {
  try {
    const db = getDatabase();
    const collection = db.collection(collection_name);
    
    let query;
    try {
      query = { _id: new ObjectId(id), deleted_at: { $exists: false } };
    } catch (e) {
      throw new Error('Invalid ID format');
    }
    
    const result = await collection.findOne(query);
    if (!result) {
      throw new Error(`${collection_name.slice(0, -1)} not found`);
    }
    
    return result;
  } catch (error) {
    throw new Error(`Failed to fetch ${collection_name.slice(0, -1)}: ${error.message}`);
  }
}

export async function create(collection_name, data) {
  try {
    const db = getDatabase();
    const collection = db.collection(collection_name);
    
    // Validate data using model validation
    const model = getModel(collection_name);
    if (model.validateUser || model.validatePosition || model.validateCandidate || model.validateVote || model.validateElection) {
      const validateFunction = model[`validate${collection_name.charAt(0).toUpperCase() + collection_name.slice(1, -1)}`];
      if (validateFunction) {
        const errors = validateFunction(data);
        if (errors.length > 0) {
          throw new Error(`Validation failed: ${errors.join(', ')}`);
        }
      }
    }
    
    // Convert string IDs to ObjectIds and add timestamps
    const processedData = convertObjectIds(addTimestamps(data));
    
    const result = await collection.insertOne(processedData);
    
    // Return the created document
    return await collection.findOne({ _id: result.insertedId });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Duplicate entry: A record with this unique field already exists');
    }
    throw new Error(`Failed to create ${collection_name.slice(0, -1)}: ${error.message}`);
  }
}

export async function update(collection_name, id, data) {
  try {
    const db = getDatabase();
    const collection = db.collection(collection_name);
    
    let query;
    try {
      query = { _id: new ObjectId(id), deleted_at: { $exists: false } };
    } catch (e) {
      throw new Error('Invalid ID format');
    }
    
    // Check if document exists
    const existing = await collection.findOne(query);
    if (!existing) {
      throw new Error(`${collection_name.slice(0, -1)} not found`);
    }
    
    // Remove fields that shouldn't be updated
    const { _id, created_at, deleted_at, ...updateData } = data;
    
    // Convert string IDs to ObjectIds and add updated timestamp
    const processedData = convertObjectIds(addTimestamps(updateData, true));
    
    const result = await collection.updateOne(query, { $set: processedData });
    
    if (result.matchedCount === 0) {
      throw new Error(`${collection_name.slice(0, -1)} not found`);
    }
    
    // Return the updated document
    return await collection.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Duplicate entry: A record with this unique field already exists');
    }
    throw new Error(`Failed to update ${collection_name.slice(0, -1)}: ${error.message}`);
  }
}

export async function softDelete(collection_name, id) {
  try {
    const db = getDatabase();
    const collection = db.collection(collection_name);
    
    let query;
    try {
      query = { _id: new ObjectId(id), deleted_at: { $exists: false } };
    } catch (e) {
      throw new Error('Invalid ID format');
    }
    
    const result = await collection.updateOne(
      query,
      { 
        $set: { 
          deleted_at: new Date(),
          updated_at: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      throw new Error(`${collection_name.slice(0, -1)} not found`);
    }
    
    return { message: `${collection_name.slice(0, -1)} deleted successfully` };
  } catch (error) {
    throw new Error(`Failed to delete ${collection_name.slice(0, -1)}: ${error.message}`);
  }
}

// Special function to check for duplicate votes
export async function checkVoteConstraint(user_id, position_id, period_start, period_end) {
  try {
    const db = getDatabase();
    const collection = db.collection('votes');
    
    const existing = await collection.findOne({
      user_id: new ObjectId(user_id),
      position_id,
      period_start,
      period_end,
      deleted_at: { $exists: false }
    });
    
    return existing !== null;
  } catch (error) {
    throw new Error(`Failed to check vote constraint: ${error.message}`);
  }
}