const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedWorkouts() {
  const jsonPath = path.join(__dirname, '../assets/workouts_seed.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: Seed JSON file not found at ${jsonPath}`);
    process.exit(1);
  }

  const workoutsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`🚀 Using key type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'}`);
  console.log(`🚀 Found ${workoutsData.length} workouts to seed into Supabase...`);

  for (const workout of workoutsData) {
    console.log(`  -> Seeding: ${workout.slug} ("${workout.title}")`);
    const { data, error } = await supabase
      .from('workouts')
      .upsert(workout, { onConflict: 'slug' });

    if (error) {
      console.error(`  ❌ Failed to seed ${workout.slug}:`, error.message);
    } else {
      console.log(`  ✅ Successfully seeded ${workout.slug}`);
    }
  }

  console.log('\n🎉 Seeding process complete!');
}

seedWorkouts();
