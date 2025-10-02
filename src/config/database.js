import { MongoClient } from 'mongodb';

let db_instance = null;

export async function connectDatabase() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    db_instance = client.db('pemiyos');
    console.log('✅ Connected to MongoDB Atlas');
    return db_instance;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

export function getDatabase() {
  if (!db_instance) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return db_instance;
}