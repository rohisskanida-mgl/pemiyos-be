import 'dotenv/config';
import { connectDatabase } from './src/config/database.js';

// Import all models to get their indexes
import * as usersModel from './src/models/users.model.js';
import * as positionsModel from './src/models/positions.model.js';
import * as candidatesModel from './src/models/candidates.model.js';
import * as votesModel from './src/models/votes.model.js';
import * as electionsModel from './src/models/elections.model.js';

const models = {
  users: usersModel,
  positions: positionsModel,
  candidates: candidatesModel,
  votes: votesModel,
  elections: electionsModel,
};

async function createIndexes() {
  try {
    console.log('🔗 Connecting to database...');
    const db = await connectDatabase();

    for (const [collectionName, model] of Object.entries(models)) {
      if (model.indexes && Array.isArray(model.indexes)) {
        console.log(`📋 Creating indexes for ${collectionName}...`);

        for (const index of model.indexes) {
          try {
            await db.collection(collectionName).createIndex(index.key, {
              unique: index.unique || false,
              name: index.name || undefined,
            });
            console.log(`  ✅ Created index: ${JSON.stringify(index.key)}`);
          } catch (error) {
            if (error.code === 11000) {
              console.log(`  ⚠️  Index already exists: ${JSON.stringify(index.key)}`);
            } else {
              console.error(`  ❌ Failed to create index ${JSON.stringify(index.key)}:`, error.message);
            }
          }
        }
      }
    }

    console.log('\n🎉 All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
