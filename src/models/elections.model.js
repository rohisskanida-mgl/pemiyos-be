export const collection_name = 'elections';

export const schema = {
  period_start: { type: 'number', required: true },
  period_end: { type: 'number', required: true },
  voting_start: { type: 'date' },
  voting_end: { type: 'date' },
  status: { type: 'string', enum: ['upcoming', 'ongoing', 'closed'], default: 'upcoming' },
  created_at: { type: 'date', auto: true },
  updated_at: { type: 'date' },
  deleted_at: { type: 'date' }
};

export const indexes = [
  { key: { period_start: 1, period_end: 1 }, unique: true },
  { key: { deleted_at: 1 } },
  { key: { status: 1 } },
  { key: { voting_start: 1 } },
  { key: { voting_end: 1 } }
];

export function validateElection(data) {
  const errors = [];
  
  if (!data.period_start || typeof data.period_start !== 'number') {
    errors.push('Period start is required and must be a number');
  }
  
  if (!data.period_end || typeof data.period_end !== 'number') {
    errors.push('Period end is required and must be a number');
  }
  
  if (data.status && !['upcoming', 'ongoing', 'closed'].includes(data.status)) {
    errors.push('Status must be "upcoming", "ongoing", or "closed"');
  }
  
  if (data.period_start && data.period_end && data.period_start >= data.period_end) {
    errors.push('Period start must be less than period end');
  }
  
  if (data.voting_start && data.voting_end && new Date(data.voting_start) >= new Date(data.voting_end)) {
    errors.push('Voting start must be before voting end');
  }
  
  return errors;
}

export const searchableFields = ['status'];