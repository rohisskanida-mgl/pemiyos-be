export const collection_name = 'users';

export const schema = {
  nis: { type: 'string', required: true, unique: true },
  password: { type: 'string', required: true },
  nama_lengkap: { type: 'string', required: true },
  role: { type: 'string', enum: ['voter', 'admin'], default: 'voter' },
  status: { type: 'string', enum: ['active', 'inactive'], default: 'active' },
  last_login_at: { type: 'date' },
  created_at: { type: 'date', auto: true },
  updated_at: { type: 'date' },
  deleted_at: { type: 'date' }
};

export const indexes = [
  { key: { nis: 1 }, unique: true },
  { key: { deleted_at: 1 } },
  { key: { status: 1 } },
  { key: { role: 1 } }
];

export function validateUser(data) {
  const errors = [];
  
  if (!data.nis || typeof data.nis !== 'string') {
    errors.push('NIS is required and must be a string');
  }
  
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required and must be a string');
  }
  
  if (!data.nama_lengkap || typeof data.nama_lengkap !== 'string') {
    errors.push('Nama lengkap is required and must be a string');
  }
  
  if (data.role && !['voter', 'admin'].includes(data.role)) {
    errors.push('Role must be either "voter" or "admin"');
  }
  
  if (data.status && !['active', 'inactive'].includes(data.status)) {
    errors.push('Status must be either "active" or "inactive"');
  }
  
  return errors;
}

export const searchableFields = ['nis', 'nama_lengkap', 'role', 'status'];