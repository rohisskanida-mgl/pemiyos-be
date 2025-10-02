import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDatabase } from './src/config/database.js';
import * as CrudService from './src/services/crud.service.js';

async function insertSampleData() {
  try {
    console.log('🔗 Connecting to database...');
    const db = await connectDatabase();

    // Sample users
    const users = [
      {
        nis: "Admin",
        password: "Admin123",
        nama_lengkap: "Admin User",
        role: "admin",
        status: "active"
      },
      {
        nis: "234567",
        password: "voter123",
        nama_lengkap: "John Doe",
        role: "voter",
        status: "active"
      },
      {
        nis: "345678",
        password: "voter123",
        nama_lengkap: "Jane Smith",
        role: "voter",
        status: "active"
      }
    ];

    // Sample positions
    const positions = [
      {
        position_id: 1,
        name: "Ketua",
        description: "Ketua Organisasi",
        status: "active"
      },
      {
        position_id: 2,
        name: "Sekretaris",
        description: "Sekretaris Organisasi",
        status: "active"
      },
      {
        position_id: 3,
        name: "Bendahara",
        description: "Bendahara Organisasi",
        status: "active"
      }
    ];

    // Sample election
    const elections = [
      {
        period_start: 2025,
        period_end: 2026,
        voting_start: new Date('2025-01-01'),
        voting_end: new Date('2025-01-31'),
        status: "upcoming"
      }
    ];

    // Insert data using CRUD service methods for proper validation and constraints
    console.log('👥 Inserting sample users...');
    for (const user of users) {
      try {
        await CrudService.create('users', user);
        console.log(`  ✅ Created user: ${user.nama_lengkap}`);
      } catch (error) {
        if (error.message.includes('Duplicate entry')) {
          console.log(`  ⚠️  User already exists: ${user.nama_lengkap}`);
        } else {
          console.error(`  ❌ Failed to create user ${user.nama_lengkap}:`, error.message);
        }
      }
    }

    console.log('🏛️ Inserting sample positions...');
    for (const position of positions) {
      try {
        await CrudService.create('positions', position);
        console.log(`  ✅ Created position: ${position.name}`);
      } catch (error) {
        if (error.message.includes('Duplicate entry')) {
          console.log(`  ⚠️  Position already exists: ${position.name}`);
        } else {
          console.error(`  ❌ Failed to create position ${position.name}:`, error.message);
        }
      }
    }

    console.log('🗳️ Inserting sample election...');
    for (const election of elections) {
      try {
        await CrudService.create('elections', election);
        console.log(`  ✅ Created election: ${election.period_start}-${election.period_end}`);
      } catch (error) {
        if (error.message.includes('Duplicate entry')) {
          console.log(`  ⚠️  Election already exists: ${election.period_start}-${election.period_end}`);
        } else {
          console.error(`  ❌ Failed to create election:`, error.message);
        }
      }
    }

    // Get user IDs for candidates
    const insertedUsers = await CrudService.findAll('users');
    
    if (insertedUsers.length >= 2) {
      const candidates = [
        {
          position_id: 1,
          candidate_number: 1,
          period_start: 2025,
          period_end: 2026,
          user_id: insertedUsers[0]._id.toString(),
          name: insertedUsers[0].nama_lengkap,
          profile: "Experienced leader with vision for change",
          vision_mission: {
            vision: "To create a better organization for everyone",
            mission: "To create a better organization for everyone",
          },
          program_kerja: "1. Improve communication\n2. Increase participation\n3. Better events",
          status: "active"
        },
        {
          position_id: 1,
          candidate_number: 2,
          period_start: 2025,
          period_end: 2026,
          user_id: insertedUsers[1]._id.toString(),
          name: insertedUsers[1].nama_lengkap,
          profile: "Fresh perspective with innovative ideas",
          vision_mission: {
            vision: "Innovation and progress for our organization",
            mission: "Innovation and progress for our organization",
          },
          program_kerja: "1. Digital transformation\n2. Youth engagement\n3. Sustainability",
          status: "active"
        }
      ];

      console.log('🏃 Inserting sample candidates...');
      for (const candidate of candidates) {
        try {
          await CrudService.create('candidates', candidate);
          console.log(`  ✅ Created candidate: ${candidate.name} (Candidate #${candidate.candidate_number})`);
        } catch (error) {
          if (error.message.includes('Duplicate entry')) {
            console.log(`  ⚠️  Candidate already exists: ${candidate.name}`);
          } else {
            console.error(`  ❌ Failed to create candidate ${candidate.name}:`, error.message);
          }
        }
      }
    }

    console.log('\n🎉 Sample data inserted successfully!');
    console.log('\n📋 Test credentials:');
    console.log('Admin: NIS=Admin, Password=Admin123');
    console.log('Voter: NIS=234567, Password=voter123');
    console.log('Voter: NIS=345678, Password=voter123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    process.exit(1);
  }
}

insertSampleData();