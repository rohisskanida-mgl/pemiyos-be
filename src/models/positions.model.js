export const collection_name = 'positions';

export const schema = {
  position_id: { type: 'number', required: true, unique: true },
  name: { type: 'string', required: true, unique: true },
  description: { type: 'string' },
  status: { type: 'string', enum: ['active', 'inactive'], default: 'active' },
  created_at: { type: 'date', auto: true },
  updated_at: { type: 'date' },
  deleted_at: { type: 'date' }
};

export const indexes = [
  { key: { position_id: 1 }, unique: true },
  { key: { name: 1 }, unique: true },
  { key: { deleted_at: 1 } },
  { key: { status: 1 } }
];

export function validatePosition(data) {
  const errors = [];
  
  if (!data.position_id || typeof data.position_id !== 'number') {
    errors.push('Position ID is required and must be a number');
  }
  
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Name is required and must be a string');
  }
  
  if (data.status && !['active', 'inactive'].includes(data.status)) {
    errors.push('Status must be either "active" or "inactive"');
  }
  
  return errors;
}

export const searchableFields = ['name', 'description', 'status'];