// Simple API test script
// Run this after starting the server with: npm run dev

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Voting System API\n');
  console.log("BASE URL", BASE_URL);
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test 2: Login
    console.log('\n2. Testing login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nis: 'Admin', password: 'Admin123' })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, got token');
    
    // Test 3: Get profile
    console.log('\n3. Testing profile endpoint...');
    const profileResponse = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!profileResponse.ok) {
      throw new Error(`Profile failed: ${profileResponse.status}`);
    }
    
    const profileData = await profileResponse.json();
    console.log('✅ Profile retrieved:', profileData.nama_lengkap);
    
    // Test 4: Get users
    console.log('\n4. Testing users endpoint...');
    const usersResponse = await fetch(`${BASE_URL}/api/users?limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!usersResponse.ok) {
      throw new Error(`Users failed: ${usersResponse.status}`);
    }
    
    const usersData = await usersResponse.json();
    console.log(`✅ Retrieved ${usersData.length} users`);
    
    // Test 5: Get positions
    console.log('\n5. Testing positions endpoint...');
    const positionsResponse = await fetch(`${BASE_URL}/api/positions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!positionsResponse.ok) {
      throw new Error(`Positions failed: ${positionsResponse.status}`);
    }
    
    const positionsData = await positionsResponse.json();
    console.log(`✅ Retrieved ${positionsData.length} positions`);
    
    // Test 6: Search users
    console.log('\n6. Testing search functionality...');
    const searchResponse = await fetch(`${BASE_URL}/api/users?search=John`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    console.log(`✅ Search found ${searchData.length} users matching "John"`);
    
    // Test 7: Count records
    console.log('\n7. Testing count functionality...');
    const countResponse = await fetch(`${BASE_URL}/api/users?is_count=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!countResponse.ok) {
      throw new Error(`Count failed: ${countResponse.status}`);
    }
    
    const countData = await countResponse.json();
    console.log(`✅ Total users count: ${countData.count}`);
    
    console.log('\n🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n💡 Make sure the server is running with: npm run dev');
    console.log('💡 And sample data is loaded with: node sample-data.js');
  }
}

// Run tests
testAPI();