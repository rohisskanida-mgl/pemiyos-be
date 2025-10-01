import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database.js';

export async function authenticateUser(nis, password) {
  try {
    const db = getDatabase();
    const collection = db.collection('users');
    
    // Find user by NIS
    const user = await collection.findOne({
      nis,
      deleted_at: { $exists: false }
    });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('Account is inactive');
    }
    
    // For MVP, we're using plain text password comparison
    if (user.password !== password) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    await collection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          last_login_at: new Date(),
          updated_at: new Date()
        } 
      }
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: user._id,
        nis: user.nis,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      token,
      user: {
        ...userWithoutPassword,
        last_login_at: new Date()
      }
    };
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export async function getUserById(user_id) {
  try {
    const db = getDatabase();
    const collection = db.collection('users');
    
    const user = await collection.findOne({
      _id: user_id,
      deleted_at: { $exists: false }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.status !== 'active') {
      throw new Error('Account is inactive');
    }
    
    // Return user data without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}