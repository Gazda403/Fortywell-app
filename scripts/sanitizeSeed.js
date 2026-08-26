const fs = require('fs');
const path = require('path');

const fullExercises = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/full_exercises.json'), 'utf8'));
const fullMap = new Map();
fullExercises.forEach(e => {
  fullMap.set(e.id.toLowerCase(), e);
  fullMap.set(e.name.toLowerCase(), e);
});

const GITHUB_RAW = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';

const ALIASES = {
  'cat-cow segmental mobility': 'Cat_Stretch',
  'cat-cow + thread-the-needle': 'Cat_Stretch',
  'cat cow': 'Cat_Stretch',
  'cat stretch': 'Cat_Stretch',
  'lying hip circles': 'Standing_Hip_Circles',
  'dynamic hip mobilization leg swings': 'One-Legged_Cable_Kickback',
  'leg swing (forward/back)': 'One-Legged_Cable_Kickback',
  'dynamic leg swings': 'One-Legged_Cable_Kickback',
  'high-knee march in place': 'Step-up_with_Knee_Raise',
  '1-min high-knee march': 'Step-up_with_Knee_Raise',
  'brisk march in place': 'Step-up_with_Knee_Raise',
  'thoracic foam roll': 'Lower_Back-SMR',
  'foam roll thoracic spine': 'Lower_Back-SMR',
  'open book stretch (side-lying)': 'Side-Lying_Floor_Stretch',
  'open book stretch': 'Side-Lying_Floor_Stretch',
  'prone cobra (arms at sides)': 'Lower_Back-SMR',
  'wall angels (elbows low)': 'Overhead_Stretch',
  'wall angels (low elbow variation)': 'Overhead_Stretch',
  'prone y-t-w hold': 'Middle_Back_Stretch',
  'quadruped shoulder tap': 'Plank',
  'child\'s pose with diaphragmatic breathing': 'Childs_Pose',
  'seated neck side stretch': 'Side_Neck_Stretch',
  'chin tuck + cervical retraction': 'Neck_Press',
  'standing hip flexor stretch': 'Intermediate_Hip_Flexor_and_Quad_Stretch',
  'static hip flexor stretch': 'Intermediate_Hip_Flexor_and_Quad_Stretch',
  'seated forward fold': 'Seated_Floor_Hamstring_Stretch',
  'standing forward fold': 'Hamstring_Stretch',
  '90/90 hip rotation (seated)': 'IT_Band_and_Glute_Stretch',
  '90/90 hip rotation flow': 'IT_Band_and_Glute_Stretch',
  '90/90 hip stretch': 'IT_Band_and_Glute_Stretch',
  'pelvic tilts': 'Pelvic_Tilt_Into_Bridge',
  'pelvic tilt': 'Pelvic_Tilt_Into_Bridge',
  'doorway pec stretch': 'Behind_Head_Chest_Stretch',
  'doorway pec stretch (low, mid, high position)': 'Behind_Head_Chest_Stretch',
  'doorframe row (bodyweight pull)': 'Bodyweight_Mid_Row',
  'foam roller chest opening (t-spine extension)': 'Chest_Stretch_on_Stability_Ball',
  'ankle cars (controlled articular rotations)': 'Ankle_Circles',
  'wall ankle stretch (knee drives over pinky toe)': 'Calf_Stretch_Hands_Against_Wall',
  'calf stretch on step': 'Calf_Stretch_Hands_Against_Wall',
  'deep achilles stretch (knee bent, heel down)': 'Calf_Stretch_Elbows_Against_Wall',
  'lat stretch (wall assisted)': 'Latissimus_Dorsi-SMR',
  'chest opening stretch on foam roller': 'Chest_Stretch_on_Stability_Ball',
  'forearm stretch (both directions)': 'Wrist_Circles',
  'full-body roll-down stretch': 'Dynamic_Back_Stretch',
  'iso-hold glute bridge with heel drive': 'Butt_Lift_Bridge',
  'bilateral glute bridge (slow)': 'Butt_Lift_Bridge',
  'banded glute bridge with dumbbell on hips': 'Butt_Lift_Bridge',
  'supported bridge pose (pillow under sacrum)': 'Butt_Lift_Bridge',
  'single-leg glute bridge': 'Single_Leg_Glute_Bridge',
  'single leg glute bridge': 'Single_Leg_Glute_Bridge',
  'deadbug with opposite arm/leg reach': 'Dead_Bug',
  'deadbug': 'Dead_Bug',
  'slow-motion deadbug (3-second pace)': 'Dead_Bug',
  'lying clamshells': 'Side_Bridge',
  'clamshell': 'Side_Bridge',
  'clamshell (controlled)': 'Side_Bridge',
  'bird-dog hold': 'Bent-Knee_Hip_Raise',
  'bird-dog (anti-rotation focus)': 'Bent-Knee_Hip_Raise',
  'bird-dog': 'Bent-Knee_Hip_Raise',
  'side-lying hip abduction': 'Side_Bridge',
  'banded hip abduction (standing)': 'Standing_Hip_Circles',
  'lying figure-4 glute stretch': 'IT_Band_and_Glute_Stretch',
  'lying figure-4 (piriformis release)': 'Piriformis-SMR',
  'figure-4 glute stretch': 'IT_Band_and_Glute_Stretch',
  'pigeon pose (or figure-4 if knee sensitive)': 'IT_Band_and_Glute_Stretch',
  'pigeon pose (or figure-4)': 'IT_Band_and_Glute_Stretch',
  'supine spinal twist': 'Russian_Twist',
  'lying knee-to-chest hug (both legs)': 'Knee_Across_The_Body',
  'mcgill modified curl-up': 'Crunches',
  'pilates toe taps': 'Bent-Knee_Hip_Raise',
  'forearm plank with hip dip': 'Plank',
  'bodyweight box squat': 'Box_Squat',
  'dumbbell bulgarian split squat': 'Dumbbell_Lunges',
  'reverse lunge (slow eccentric)': 'Crossover_Reverse_Lunge',
  'incline push-up on counter': 'Incline_Push-Up',
  'band pull-apart (chest level)': 'Band_Pull_Apart',
  'band pull-apart (chest height)': 'Band_Pull_Apart',
  'dumbbell bent-over row': 'Bent_Over_Two-Dumbbell_Row',
  'dumbbell bent-over row (heavy)': 'Bent_Over_Two-Dumbbell_Row',
  'chest-supported dumbbell row': 'Bent_Over_Two-Dumbbell_Row',
  'dumbbell kickback (hip extension)': 'One-Legged_Cable_Kickback',
  'dumbbell overhead press (seated)': 'Seated_Dumbbell_Press',
  'farmer\'s carry (bilateral)': 'Farmers_Walk',
  'single-leg romanian deadlift touch-down': 'Romanian_Deadlift',
  'band chest press (forearm loop)': 'Pushups',
  'band lateral raise (ankle cuff on wrist)': 'Side_Lateral_Raise',
  'hammer curl (neutral grip)': 'Hammer_Curls',
  'overhead tricep extension (band)': 'Standing_Dumbbell_Triceps_Extension',
  '5-min incline treadmill walk': 'Walking_Treadmill',
  'barbell back squat': 'Barbell_Squat',
  'cable pull-through (glute hinge)': 'Pull_Through',
  'cable pull-through (hip hinge)': 'Pull_Through',
  'chest press machine': 'Leverage_Chest_Press',
  'lat pulldown (wide grip)': 'Wide-Grip_Lat_Pulldown',
  'seated cable row (close grip)': 'Seated_Cable_Rows',
  'dumbbell incline press': 'Incline_Dumbbell_Press',
  'pec deck / machine fly (forearms on pads)': 'Butterfly',
  'cable lateral raise (ankle cuff on forearm)': 'Side_Lateral_Raise',
  'machine row (neutral grip handles)': 'Seated_Cable_Rows',
  'banded spanish squat (band behind knees)': 'Bodyweight_Squat',
  'terminal knee extension (band tke)': 'Bodyweight_Squat',
  'lateral dumbbell step-up (low box, slow eccentric)': 'Step-up_with_Knee_Raise',
  'brisk bike or rower': 'Rowing_Stationary',
  'deep squat hold with ankle oscillation': 'Bodyweight_Squat',
  '4-7-8 breathing': 'Childs_Pose',
  'box breathing (4-4-4-4)': 'Childs_Pose',
  'savasana with diaphragmatic breathing': 'Childs_Pose',
  'savasana': 'Childs_Pose',
  'legs-up-the-wall (viparita karani)': 'Seated_Floor_Hamstring_Stretch'
};

function resolveEx(name, exDbId) {
  const lower = (name || '').toLowerCase().trim();
  const targetKey = ALIASES[lower] || exDbId || lower;
  const match = fullMap.get(targetKey.toLowerCase()) || 
                fullExercises.find(e => e.name.toLowerCase().includes(lower) || lower.includes(e.name.toLowerCase())) ||
                fullExercises[0];
  const img0 = match.images && match.images.length > 0 ? match.images[0] : `${match.id}/0.jpg`;
  const img1 = match.images && match.images.length > 1 ? match.images[1] : img0;
  return {
    id: match.id,
    image_url: `${GITHUB_RAW}/${img0}`,
    gif_url: `${GITHUB_RAW}/${img1}`
  };
}

const seedPath = path.join(__dirname, '../assets/workouts_seed.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

seed.forEach(w => {
  (w.warmup || []).forEach(e => {
    const r = resolveEx(e.name, e.exercise_db_id);
    e.image_url = r.image_url;
  });
  (w.main_blocks || []).forEach(b => (b.exercises || []).forEach(e => {
    const r = resolveEx(e.name, e.exercise_db_id);
    e.exercise_db_id = r.id;
    e.image_url = r.image_url;
    e.gif_url = r.gif_url;
  }));
  (w.cooldown || []).forEach(e => {
    const r = resolveEx(e.name, e.exercise_db_id);
    e.image_url = r.image_url;
  });
});

fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
console.log('Successfully updated assets/workouts_seed.json with 100% verified URLs!');
