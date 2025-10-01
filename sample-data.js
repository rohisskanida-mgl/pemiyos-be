import 'dotenv/config';
import { connectDatabase } from './src/config/database.js';

async function insertSampleData() {
  try {
    console.log('🔗 Connecting to database...');
    const db = await connectDatabase();
    
    // Sample users
    const users = [
      {
        nis: "123456",
        password: "password123",
        nama_lengkap: "Admin User",
        role: "admin",
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nis: "234567",
        password: "voter123",
        nama_lengkap: "John Doe",
        role: "voter",
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nis: "345678",
        password: "voter123",
        nama_lengkap: "Jane Smith",
        role: "voter",
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    // Sample positions
    const positions = [
      {
        position_id: 1,
        name: "Ketua",
        description: "Ketua Organisasi",
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        position_id: 2,
        name: "Sekretaris",
        description: "Sekretaris Organisasi",
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        position_id: 3,
        name: "Bendahara",
        description: "Bendahara Organisasi",
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    // Sample election
    const elections = [
      {
        period_start: 2025,
        period_end: 2026,
        voting_start: new Date('2025-01-01'),
        voting_end: new Date('2025-01-31'),
        status: "upcoming",
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    // Insert data
    console.log('👥 Inserting sample users...');
    await db.collection('users').insertMany(users);
    console.log(`✅ Inserted ${users.length} users`);
    
    console.log('🏛️ Inserting sample positions...');
    await db.collection('positions').insertMany(positions);
    console.log(`✅ Inserted ${positions.length} positions`);
    
    console.log('🗳️ Inserting sample election...');
    await db.collection('elections').insertMany(elections);
    console.log(`✅ Inserted ${elections.length} election`);
    
    // Get user IDs for candidates
    const insertedUsers = await db.collection('users').find({ role: 'voter' }).toArray();
    
    if (insertedUsers.length >= 2) {
      const candidates = [
        {
          position_id: 1,
          candidate_number: 1,
          period_start: 2025,
          period_end: 2026,
          user_id: insertedUsers[0]._id,
          name: insertedUsers[0].nama_lengkap,
          profile: "Experienced leader with vision for change",
          vision_mission: "To create a better organization for everyone",
          program_kerja: "1. Improve communication\n2. Increase participation\n3. Better events",
          status: "active",
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          position_id: 1,
          candidate_number: 2,
          period_start: 2025,
          period_end: 2026,
          user_id: insertedUsers[1]._id,
          name: insertedUsers[1].nama_lengkap,
          profile: "Fresh perspective with innovative ideas",
          vision_mission: "Innovation and progress for our organization",
          program_kerja: "1. Digital transformation\n2. Youth engagement\n3. Sustainability",
          status: "active",
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      console.log('🏃 Inserting sample candidates...');
      await db.collection('candidates').insertMany(candidates);
      console.log(`✅ Inserted ${candidates.length} candidates`);
    }
    
    console.log('\n🎉 Sample data inserted successfully!');
    console.log('\n📋 Test credentials:');
    console.log('Admin: NIS=123456, Password=password123');
    console.log('Voter: NIS=234567, Password=voter123');
    console.log('Voter: NIS=345678, Password=voter123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    process.exit(1);
  }
}

insertSampleData();