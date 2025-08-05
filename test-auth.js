/**
 * Test Authentication Setup
 * 
 * This script tests the authentication setup for the Daniel Wolthers test user
 * Run with: node test-auth.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ojyonxplpmhvcgaycznc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qeW9ueHBscG1odmNnYXljem5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTcwMjQsImV4cCI6MjA2OTI3MzAyNH0.yw_s7ydtABkUJiK_2HqDI2ewbC8tSIW5MJuD_Vwxpak';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthentication() {
  console.log('🧪 Testing Authentication Setup...\n');

  try {
    console.log('1. Testing user sign-in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'daniel.wolthers@wolthers.com',
      password: 'testpassword123'
    });

    if (error) {
      console.error('❌ Sign-in failed:', error.message);
      return;
    }

    console.log('✅ Sign-in successful!');
    console.log('   User ID:', data.user.id);
    console.log('   Email:', data.user.email);

    console.log('\n2. Testing user profile fetch...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError.message);
    } else {
      console.log('✅ Profile fetch successful!');
      console.log('   Name:', profile.full_name);
      console.log('   Role:', profile.user_type);
      console.log('   Is Global Admin:', profile.is_global_admin);
      console.log('   Can View All Trips:', profile.can_view_all_trips);
    }

    console.log('\n3. Testing trips access...');
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id, title, status, start_date, end_date')
      .limit(5);

    if (tripsError) {
      console.error('❌ Trips fetch failed:', tripsError.message);
    } else {
      console.log('✅ Trips fetch successful!');
      console.log(`   Found ${trips.length} trips`);
      trips.forEach(trip => {
        console.log(`   - ${trip.title} (${trip.status})`);
      });
    }

    console.log('\n4. Testing sign-out...');
    await supabase.auth.signOut();
    console.log('✅ Sign-out successful!');

  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

// Run the test
testAuthentication().then(() => {
  console.log('\n🎉 Authentication test completed!');
  process.exit(0);
}).catch(err => {
  console.error('💥 Test failed:', err);
  process.exit(1);
});