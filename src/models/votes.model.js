import { ObjectId } from 'mongodb';

export const collection_name = 'votes';

export const schema = {
  user_id: { type: 'objectId', required: true },
  candidate_id: { type: 'objectId', required: true },
  position_id: { type: 'number', required: true },
  period_start: { type: 'number', required: true },
  period_end: { type: 'number', required: true },
  created_at: { type: 'date', auto: true },
  updated_at: { type: 'date' },
  deleted_at: { type: 'date' }
};

export const indexes = [
  { key: { user_id: 1, position_id: 1, period_start: 1, period_end: 1 }, unique: true },
  { key: { candidate_id: 1 } },
  { key: { position_id: 1 } },
  { key: { deleted_at: 1 } },
  { key: { period_start: 1, period_end: 1 } }
];

export function validateVote(data) {
  const errors = [];
  
  if (!data.user_id) {
    errors.push('User ID is required');
  } else {
    try {
      new ObjectId(data.user_id);
    } catch (e) {
      errors.push('User ID must be a valid ObjectId');
    }
  }
  
  if (!data.candidate_id) {
    errors.push('Candidate ID is required');
  } else {
    try {
      new ObjectId(data.candidate_id);
    } catch (e) {
      errors.push('Candidate ID must be a valid ObjectId');
    }
  }
  
  if (!data.position_id || typeof data.position_id !== 'number') {
    errors.push('Position ID is required and must be a number');
  }
  
  if (!data.period_start || typeof data.period_start !== 'number') {
    errors.push('Period start is required and must be a number');
  }
  
  if (!data.period_end || typeof data.period_end !== 'number') {
    errors.push('Period end is required and must be a number');
  }
  
  if (data.period_start && data.period_end && data.period_start >= data.period_end) {
    errors.push('Period start must be less than period end');
  }
  
  return errors;
}

export const searchableFields = [];