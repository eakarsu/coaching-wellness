import { getDb, initializeDb, closeDb } from './db';
import { v4 as uuidv4 } from 'uuid';

function seedDatabase() {
  console.log('Initializing database...');
  initializeDb();

  const db = getDb();

  // Clear existing data
  console.log('Clearing existing data...');
  db.exec('DELETE FROM notifications');
  db.exec('DELETE FROM appointments');
  db.exec('DELETE FROM progress_logs');
  db.exec('DELETE FROM wellness_goals');
  db.exec('DELETE FROM recipes');
  db.exec('DELETE FROM meal_plans');
  db.exec('DELETE FROM exercises');
  db.exec('DELETE FROM workouts');
  db.exec('DELETE FROM coaches');
  db.exec('DELETE FROM clients');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM roles');

  // ========== Seed Roles (15 items) ==========
  console.log('Seeding roles...');
  const roles = [
    { name: 'Super Admin', description: 'Full system access with all permissions', permissions: 'all', isDefault: 0 },
    { name: 'Admin', description: 'Administrative access to manage users and data', permissions: 'users.manage,data.manage,reports.view', isDefault: 0 },
    { name: 'Head Coach', description: 'Senior coach with team management abilities', permissions: 'clients.manage,workouts.manage,nutrition.manage,appointments.manage,coaches.view', isDefault: 0 },
    { name: 'Coach', description: 'Standard coaching access for client management', permissions: 'clients.view,workouts.manage,nutrition.manage,appointments.manage', isDefault: 0 },
    { name: 'Junior Coach', description: 'Limited coaching access for new coaches', permissions: 'clients.view,workouts.view,nutrition.view,appointments.view', isDefault: 0 },
    { name: 'Nutritionist', description: 'Specialized access for nutrition planning', permissions: 'clients.view,nutrition.manage,recipes.manage,meal-plans.manage', isDefault: 0 },
    { name: 'Fitness Trainer', description: 'Access to fitness and workout management', permissions: 'clients.view,workouts.manage,exercises.manage,progress.view', isDefault: 0 },
    { name: 'Client', description: 'Client-level access to view own data', permissions: 'own.view,appointments.view,progress.view', isDefault: 1 },
    { name: 'Viewer', description: 'Read-only access to public information', permissions: 'public.view', isDefault: 1 },
    { name: 'Receptionist', description: 'Front desk appointment and client management', permissions: 'clients.view,appointments.manage,coaches.view', isDefault: 0 },
    { name: 'Manager', description: 'Business operations and reporting access', permissions: 'reports.view,data.export,users.view,appointments.view', isDefault: 0 },
    { name: 'Wellness Coordinator', description: 'Wellness program coordination and goal tracking', permissions: 'goals.manage,progress.manage,clients.view,appointments.view', isDefault: 0 },
    { name: 'Intern', description: 'Temporary limited access for training purposes', permissions: 'public.view,workouts.view', isDefault: 0 },
    { name: 'Data Analyst', description: 'Access to analytics and reporting features', permissions: 'reports.view,data.export,progress.view,goals.view', isDefault: 0 },
    { name: 'Content Creator', description: 'Access to create workout and nutrition content', permissions: 'workouts.manage,exercises.manage,recipes.manage,nutrition.manage', isDefault: 0 },
  ];

  const insertRole = db.prepare(`INSERT INTO roles (id, name, description, permissions, isDefault, createdAt) VALUES (?, ?, ?, ?, ?, datetime('now'))`);
  const roleIds: string[] = [];
  roles.forEach(role => {
    const id = uuidv4();
    roleIds.push(id);
    insertRole.run(id, role.name, role.description, role.permissions, role.isDefault);
  });

  // ========== Seed Users (15 items) ==========
  console.log('Seeding users...');
  const users = [
    { username: 'admin', email: 'admin@wellness.com', password: 'admin123', firstName: 'System', lastName: 'Administrator', role: 'admin', phone: '555-0001' },
    { username: 'sarah.mitchell', email: 'sarah@wellness.com', password: 'coach123', firstName: 'Sarah', lastName: 'Mitchell', role: 'coach', phone: '555-0002' },
    { username: 'mike.thompson', email: 'mike@wellness.com', password: 'coach123', firstName: 'Mike', lastName: 'Thompson', role: 'coach', phone: '555-0003' },
    { username: 'emily.chen', email: 'emily@wellness.com', password: 'coach123', firstName: 'Emily', lastName: 'Chen', role: 'coach', phone: '555-0004' },
    { username: 'john.smith', email: 'john@email.com', password: 'client123', firstName: 'John', lastName: 'Smith', role: 'client', phone: '555-0101' },
    { username: 'mary.johnson', email: 'mary@email.com', password: 'client123', firstName: 'Mary', lastName: 'Johnson', role: 'client', phone: '555-0102' },
    { username: 'robert.davis', email: 'robert@email.com', password: 'client123', firstName: 'Robert', lastName: 'Davis', role: 'client', phone: '555-0103' },
    { username: 'patricia.w', email: 'patricia@email.com', password: 'client123', firstName: 'Patricia', lastName: 'Williams', role: 'client', phone: '555-0104' },
    { username: 'james.r', email: 'james@wellness.com', password: 'coach123', firstName: 'James', lastName: 'Rodriguez', role: 'coach', phone: '555-0005' },
    { username: 'lisa.a', email: 'lisa@wellness.com', password: 'coach123', firstName: 'Lisa', lastName: 'Anderson', role: 'coach', phone: '555-0006' },
    { username: 'front.desk', email: 'desk@wellness.com', password: 'desk123', firstName: 'Front', lastName: 'Desk', role: 'viewer', phone: '555-0007' },
    { username: 'data.analyst', email: 'analyst@wellness.com', password: 'analyst123', firstName: 'Data', lastName: 'Analyst', role: 'viewer', phone: '555-0008' },
    { username: 'michael.b', email: 'michael@email.com', password: 'client123', firstName: 'Michael', lastName: 'Brown', role: 'client', phone: '555-0105' },
    { username: 'jennifer.g', email: 'jennifer@email.com', password: 'client123', firstName: 'Jennifer', lastName: 'Garcia', role: 'client', phone: '555-0106' },
    { username: 'manager1', email: 'manager@wellness.com', password: 'manager123', firstName: 'Tom', lastName: 'Manager', role: 'admin', phone: '555-0009' },
  ];

  const insertUser = db.prepare(`INSERT INTO users (id, username, email, password, firstName, lastName, role, phone, isActive, lastLogin, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now', '-' || ? || ' hours'), datetime('now'), datetime('now'))`);
  const userIds: string[] = [];
  users.forEach((user, index) => {
    const id = uuidv4();
    userIds.push(id);
    insertUser.run(id, user.username, user.email, user.password, user.firstName, user.lastName, user.role, user.phone, index * 3);
  });

  // ========== Seed Notifications (15 items) ==========
  console.log('Seeding notifications...');
  const notifications = [
    { title: 'Welcome to Wellness Coach Pro', message: 'Your account has been created successfully. Start by exploring the dashboard.', type: 'success', link: '/' },
    { title: 'New Client Registration', message: 'John Smith has registered as a new client. Review their profile.', type: 'info', link: '/clients' },
    { title: 'Appointment Reminder', message: 'You have a training session with Mary Johnson tomorrow at 10:00 AM.', type: 'warning', link: '/appointments' },
    { title: 'Goal Achieved!', message: 'Robert Davis has completed his marathon training goal. Congratulations!', type: 'success', link: '/wellness' },
    { title: 'Missed Appointment', message: 'Patricia Williams missed her scheduled appointment on Monday.', type: 'error', link: '/appointments' },
    { title: 'New Workout Created', message: 'Coach Mike created a new HIIT Cardio Burn workout program.', type: 'info', link: '/fitness' },
    { title: 'Meal Plan Updated', message: 'The Weight Loss Starter meal plan has been updated with new recipes.', type: 'info', link: '/nutrition' },
    { title: 'System Maintenance', message: 'Scheduled maintenance tonight from 2-4 AM. System may be briefly unavailable.', type: 'warning', link: '/' },
    { title: 'Progress Report Ready', message: 'Monthly progress reports are now available for all active clients.', type: 'info', link: '/wellness' },
    { title: 'Client Deactivated', message: 'Nancy White has been marked as inactive. Follow up recommended.', type: 'warning', link: '/clients' },
    { title: 'New Recipe Added', message: 'Grilled Chicken Salad recipe has been added to the nutrition library.', type: 'success', link: '/nutrition' },
    { title: 'Certification Expiring', message: 'Coach Lisa Anderson NASM certification expires in 30 days.', type: 'warning', link: '/admin' },
    { title: 'Data Export Complete', message: 'Your requested data export is ready for download.', type: 'success', link: '/admin' },
    { title: 'Low Attendance Alert', message: '3 clients have missed more than 2 sessions this month.', type: 'error', link: '/appointments' },
    { title: 'Weekly Summary', message: 'This week: 45 sessions completed, 3 new clients, 12 goals updated.', type: 'info', link: '/' },
  ];

  const insertNotification = db.prepare(`INSERT INTO notifications (id, userId, title, message, type, isRead, link, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))`);
  notifications.forEach((notif, index) => {
    insertNotification.run(uuidv4(), userIds[index % userIds.length], notif.title, notif.message, notif.type, index < 5 ? 0 : 1, notif.link, index * 6);
  });

  // ========== Seed Coaches (15 items) ==========
  console.log('Seeding coaches...');
  const coaches = [
    { name: 'Dr. Sarah Mitchell', email: 'sarah.c@wellness.com', specialization: 'Weight Management', certifications: 'NASM-CPT, Precision Nutrition', experience: 12, bio: 'Specialized in sustainable weight loss', availability: 'Mon-Fri 9AM-5PM', rating: 4.9 },
    { name: 'Mike Thompson', email: 'mike.c@wellness.com', specialization: 'Strength Training', certifications: 'CSCS, USAW', experience: 8, bio: 'Olympic lifting specialist', availability: 'Mon-Sat 6AM-2PM', rating: 4.8 },
    { name: 'Emily Chen', email: 'emily.c@wellness.com', specialization: 'Yoga & Mindfulness', certifications: 'RYT-500, Meditation Teacher', experience: 10, bio: 'Holistic wellness approach', availability: 'Tue-Sun 7AM-3PM', rating: 4.95 },
    { name: 'James Rodriguez', email: 'james.c@wellness.com', specialization: 'Sports Nutrition', certifications: 'RD, CSSD', experience: 15, bio: 'Former Olympic athlete nutritionist', availability: 'Mon-Fri 8AM-4PM', rating: 4.85 },
    { name: 'Lisa Anderson', email: 'lisa.c@wellness.com', specialization: 'Rehabilitation', certifications: 'DPT, OCS', experience: 11, bio: 'Post-injury recovery specialist', availability: 'Mon-Thu 10AM-6PM', rating: 4.7 },
    { name: 'David Park', email: 'david@wellness.com', specialization: 'HIIT & Cardio', certifications: 'ACE-CPT, Spinning', experience: 6, bio: 'High-intensity training expert', availability: 'Mon-Sat 5AM-1PM', rating: 4.75 },
    { name: 'Rachel Green', email: 'rachel@wellness.com', specialization: 'Prenatal Fitness', certifications: 'AFAA, Pre/Postnatal', experience: 9, bio: 'Womens health specialist', availability: 'Tue-Sat 9AM-5PM', rating: 4.9 },
    { name: 'Tom Wilson', email: 'tom@wellness.com', specialization: 'Senior Fitness', certifications: 'ACE-SFC, CIFT', experience: 14, bio: 'Aging gracefully specialist', availability: 'Mon-Fri 7AM-3PM', rating: 4.8 },
    { name: 'Amanda Foster', email: 'amanda@wellness.com', specialization: 'Stress Management', certifications: 'NBC-HWC, Certified Coach', experience: 7, bio: 'Corporate wellness expert', availability: 'Mon-Fri 11AM-7PM', rating: 4.65 },
    { name: 'Chris Martinez', email: 'chris@wellness.com', specialization: 'Functional Training', certifications: 'FMS, CFSC', experience: 10, bio: 'Movement pattern specialist', availability: 'Tue-Sat 6AM-2PM', rating: 4.85 },
    { name: 'Jennifer Wu', email: 'jennifer.w@wellness.com', specialization: 'Plant-Based Nutrition', certifications: 'CNS, Plant-Based Pro', experience: 8, bio: 'Vegan nutrition expert', availability: 'Mon-Fri 9AM-5PM', rating: 4.7 },
    { name: 'Mark Stevens', email: 'mark@wellness.com', specialization: 'Bodybuilding', certifications: 'IFBB Pro, NASM', experience: 16, bio: 'Competition prep specialist', availability: 'Mon-Sat 4AM-12PM', rating: 4.9 },
    { name: 'Nicole Brown', email: 'nicole@wellness.com', specialization: 'Sleep Coaching', certifications: 'CCSH, Wellness Coach', experience: 5, bio: 'Sleep optimization expert', availability: 'Mon-Fri 2PM-10PM', rating: 4.6 },
    { name: 'Robert Kim', email: 'robert.k@wellness.com', specialization: 'Athletic Performance', certifications: 'CSCS, PES', experience: 13, bio: 'Pro athlete trainer', availability: 'Tue-Sun 5AM-1PM', rating: 4.95 },
    { name: 'Stephanie Hall', email: 'stephanie@wellness.com', specialization: 'Mental Wellness', certifications: 'LPC, NBC-HWC', experience: 11, bio: 'Mind-body connection coach', availability: 'Mon-Thu 10AM-6PM', rating: 4.8 },
  ];

  const insertCoach = db.prepare(`INSERT INTO coaches (id, name, email, specialization, certifications, experience, bio, availability, rating, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`);
  const coachIds: string[] = [];
  coaches.forEach(coach => {
    const id = uuidv4();
    coachIds.push(id);
    insertCoach.run(id, coach.name, coach.email, coach.specialization, coach.certifications, coach.experience, coach.bio, coach.availability, coach.rating, '/images/coach-placeholder.jpg');
  });

  // ========== Seed Clients (15 items) ==========
  console.log('Seeding clients...');
  const clients = [
    { name: 'John Smith', email: 'john.c@email.com', phone: '555-0101', age: 35, gender: 'Male', goals: 'Lose 20 lbs, Build muscle', healthConditions: 'None', status: 'active' },
    { name: 'Mary Johnson', email: 'mary.c@email.com', phone: '555-0102', age: 42, gender: 'Female', goals: 'Improve flexibility, Reduce stress', healthConditions: 'Mild hypertension', status: 'active' },
    { name: 'Robert Davis', email: 'robert.c@email.com', phone: '555-0103', age: 28, gender: 'Male', goals: 'Train for marathon', healthConditions: 'None', status: 'active' },
    { name: 'Patricia Williams', email: 'patricia.c@email.com', phone: '555-0104', age: 55, gender: 'Female', goals: 'Maintain mobility, Bone health', healthConditions: 'Osteoporosis', status: 'active' },
    { name: 'Michael Brown', email: 'michael.c@email.com', phone: '555-0105', age: 31, gender: 'Male', goals: 'Gain muscle mass', healthConditions: 'None', status: 'active' },
    { name: 'Jennifer Garcia', email: 'jennifer.c@email.com', phone: '555-0106', age: 38, gender: 'Female', goals: 'Post-pregnancy fitness', healthConditions: 'Diastasis recti', status: 'active' },
    { name: 'William Miller', email: 'william@email.com', phone: '555-0107', age: 45, gender: 'Male', goals: 'Lower cholesterol, Lose weight', healthConditions: 'High cholesterol', status: 'active' },
    { name: 'Elizabeth Wilson', email: 'elizabeth@email.com', phone: '555-0108', age: 29, gender: 'Female', goals: 'Build strength, Tone muscles', healthConditions: 'None', status: 'active' },
    { name: 'David Martinez', email: 'david.m@email.com', phone: '555-0109', age: 52, gender: 'Male', goals: 'Manage diabetes through exercise', healthConditions: 'Type 2 Diabetes', status: 'active' },
    { name: 'Susan Anderson', email: 'susan@email.com', phone: '555-0110', age: 33, gender: 'Female', goals: 'Improve sleep, Reduce anxiety', healthConditions: 'Anxiety', status: 'active' },
    { name: 'Christopher Taylor', email: 'chris.t@email.com', phone: '555-0111', age: 40, gender: 'Male', goals: 'Increase energy levels', healthConditions: 'None', status: 'pending' },
    { name: 'Margaret Thomas', email: 'margaret@email.com', phone: '555-0112', age: 62, gender: 'Female', goals: 'Stay active in retirement', healthConditions: 'Arthritis', status: 'active' },
    { name: 'Daniel Jackson', email: 'daniel@email.com', phone: '555-0113', age: 26, gender: 'Male', goals: 'Athletic performance', healthConditions: 'None', status: 'active' },
    { name: 'Nancy White', email: 'nancy@email.com', phone: '555-0114', age: 48, gender: 'Female', goals: 'Menopause wellness', healthConditions: 'None', status: 'inactive' },
    { name: 'Paul Harris', email: 'paul@email.com', phone: '555-0115', age: 37, gender: 'Male', goals: 'Stress management, Work-life balance', healthConditions: 'None', status: 'active' },
  ];

  const insertClient = db.prepare(`INSERT INTO clients (id, name, email, phone, age, gender, goals, healthConditions, startDate, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now', '-' || ? || ' days'), ?, '', datetime('now'), datetime('now'))`);
  const clientIds: string[] = [];
  clients.forEach((client, index) => {
    const id = uuidv4();
    clientIds.push(id);
    insertClient.run(id, client.name, client.email, client.phone, client.age, client.gender, client.goals, client.healthConditions, (index + 1) * 10, client.status);
  });

  // ========== Seed Workouts (15 items) ==========
  console.log('Seeding workouts...');
  const workouts = [
    { name: 'Full Body Blast', description: 'Complete full body workout targeting all major muscle groups', category: 'Full Body', difficulty: 'intermediate', duration: 45, caloriesBurned: 400, exercises: 'Squats, Push-ups, Rows, Lunges, Planks' },
    { name: 'HIIT Cardio Burn', description: 'High intensity interval training for maximum calorie burn', category: 'Cardio', difficulty: 'advanced', duration: 30, caloriesBurned: 450, exercises: 'Burpees, Jump Squats, Mountain Climbers, High Knees' },
    { name: 'Upper Body Strength', description: 'Build upper body strength and muscle definition', category: 'Strength', difficulty: 'intermediate', duration: 40, caloriesBurned: 300, exercises: 'Bench Press, Shoulder Press, Pull-ups, Bicep Curls' },
    { name: 'Lower Body Power', description: 'Strengthen and tone legs and glutes', category: 'Strength', difficulty: 'intermediate', duration: 45, caloriesBurned: 350, exercises: 'Squats, Deadlifts, Leg Press, Calf Raises' },
    { name: 'Yoga Flow', description: 'Gentle yoga sequence for flexibility and relaxation', category: 'Flexibility', difficulty: 'beginner', duration: 60, caloriesBurned: 200, exercises: 'Sun Salutation, Warrior Poses, Tree Pose, Savasana' },
    { name: 'Core Crusher', description: 'Intense core workout for abs and stability', category: 'Core', difficulty: 'advanced', duration: 25, caloriesBurned: 250, exercises: 'Planks, Russian Twists, Leg Raises, Crunches' },
    { name: 'Beginner Basics', description: 'Perfect introduction to fitness for newcomers', category: 'Full Body', difficulty: 'beginner', duration: 30, caloriesBurned: 200, exercises: 'Bodyweight Squats, Wall Push-ups, Bridges, Stretches' },
    { name: 'Spin Class', description: 'High energy indoor cycling session', category: 'Cardio', difficulty: 'intermediate', duration: 45, caloriesBurned: 500, exercises: 'Warm-up, Intervals, Hills, Sprint, Cool-down' },
    { name: 'Pilates Core', description: 'Pilates-based core strengthening workout', category: 'Core', difficulty: 'beginner', duration: 50, caloriesBurned: 250, exercises: 'The Hundred, Roll-up, Single Leg Stretch, Plank' },
    { name: 'Boxing Conditioning', description: 'Boxing-inspired cardio and strength training', category: 'Cardio', difficulty: 'advanced', duration: 45, caloriesBurned: 550, exercises: 'Jab-Cross, Hooks, Uppercuts, Speed Bag, Heavy Bag' },
    { name: 'Stretching & Recovery', description: 'Active recovery and flexibility session', category: 'Recovery', difficulty: 'beginner', duration: 30, caloriesBurned: 100, exercises: 'Static Stretches, Foam Rolling, Light Movement' },
    { name: 'Functional Fitness', description: 'Everyday movement patterns for real-world strength', category: 'Functional', difficulty: 'intermediate', duration: 40, caloriesBurned: 350, exercises: 'Kettlebell Swings, Turkish Get-ups, Farmer Carries' },
    { name: 'Tabata Training', description: '20 seconds on, 10 seconds off intense intervals', category: 'HIIT', difficulty: 'advanced', duration: 20, caloriesBurned: 300, exercises: 'Squat Jumps, Push-ups, Sprints, Burpees' },
    { name: 'Seniors Fitness', description: 'Safe and effective workout for older adults', category: 'Low Impact', difficulty: 'beginner', duration: 35, caloriesBurned: 150, exercises: 'Chair Exercises, Light Walking, Balance Work' },
    { name: 'Athletic Performance', description: 'Sport-specific training for athletes', category: 'Athletic', difficulty: 'advanced', duration: 60, caloriesBurned: 600, exercises: 'Plyometrics, Agility Drills, Power Cleans, Sprints' },
  ];

  const insertWorkout = db.prepare(`INSERT INTO workouts (id, clientId, clientName, name, description, category, difficulty, duration, caloriesBurned, exercises, imageUrl, creationType, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', datetime('now'))`);
  workouts.forEach((workout, index) => {
    const clientIndex = index % clientIds.length;
    insertWorkout.run(uuidv4(), clientIds[clientIndex], clients[clientIndex].name, workout.name, workout.description, workout.category, workout.difficulty, workout.duration, workout.caloriesBurned, workout.exercises, '/images/workout-placeholder.jpg');
  });

  // ========== Seed Exercises (15 items) ==========
  console.log('Seeding exercises...');
  const exercises = [
    { name: 'Barbell Squat', description: 'Compound lower body exercise', muscleGroup: 'Legs', equipment: 'Barbell, Squat Rack', instructions: 'Stand with feet shoulder-width apart, bar on upper back. Squat down until thighs are parallel, then drive up.', sets: 4, reps: 8, restTime: 90 },
    { name: 'Bench Press', description: 'Classic chest builder', muscleGroup: 'Chest', equipment: 'Barbell, Bench', instructions: 'Lie on bench, grip bar slightly wider than shoulders. Lower to chest, press up explosively.', sets: 4, reps: 10, restTime: 60 },
    { name: 'Deadlift', description: 'Full body strength exercise', muscleGroup: 'Back', equipment: 'Barbell', instructions: 'Stand with feet hip-width, grip bar outside knees. Keep back flat, drive through heels to stand.', sets: 4, reps: 6, restTime: 120 },
    { name: 'Pull-ups', description: 'Upper back and bicep builder', muscleGroup: 'Back', equipment: 'Pull-up Bar', instructions: 'Hang from bar with overhand grip. Pull up until chin clears bar, lower with control.', sets: 3, reps: 10, restTime: 60 },
    { name: 'Shoulder Press', description: 'Overhead pressing movement', muscleGroup: 'Shoulders', equipment: 'Dumbbells', instructions: 'Hold dumbbells at shoulder height. Press overhead until arms extended, lower with control.', sets: 3, reps: 12, restTime: 60 },
    { name: 'Lunges', description: 'Unilateral leg exercise', muscleGroup: 'Legs', equipment: 'Bodyweight or Dumbbells', instructions: 'Step forward into lunge position. Lower until back knee nearly touches ground, push back up.', sets: 3, reps: 12, restTime: 45 },
    { name: 'Plank', description: 'Core stability exercise', muscleGroup: 'Core', equipment: 'None', instructions: 'Hold push-up position on forearms. Keep body in straight line, engage core throughout.', sets: 3, reps: 60, restTime: 30 },
    { name: 'Bicep Curls', description: 'Isolated bicep exercise', muscleGroup: 'Arms', equipment: 'Dumbbells', instructions: 'Stand with dumbbells at sides. Curl up while keeping elbows stationary, lower slowly.', sets: 3, reps: 12, restTime: 45 },
    { name: 'Tricep Dips', description: 'Tricep isolation movement', muscleGroup: 'Arms', equipment: 'Parallel Bars or Bench', instructions: 'Lower body by bending elbows to 90 degrees. Press back up to full extension.', sets: 3, reps: 15, restTime: 45 },
    { name: 'Russian Twists', description: 'Rotational core exercise', muscleGroup: 'Core', equipment: 'Medicine Ball (optional)', instructions: 'Sit with knees bent, lean back slightly. Rotate torso side to side, touching ground each side.', sets: 3, reps: 20, restTime: 30 },
    { name: 'Lat Pulldown', description: 'Latissimus dorsi exercise', muscleGroup: 'Back', equipment: 'Cable Machine', instructions: 'Grip bar wide, pull down to upper chest while squeezing shoulder blades. Control the return.', sets: 3, reps: 12, restTime: 60 },
    { name: 'Leg Press', description: 'Machine-based leg exercise', muscleGroup: 'Legs', equipment: 'Leg Press Machine', instructions: 'Sit in machine, feet shoulder-width on platform. Lower until knees at 90 degrees, press up.', sets: 4, reps: 10, restTime: 90 },
    { name: 'Face Pulls', description: 'Rear delt and upper back exercise', muscleGroup: 'Shoulders', equipment: 'Cable Machine, Rope', instructions: 'Pull rope towards face, spreading hands apart at end. Squeeze shoulder blades together.', sets: 3, reps: 15, restTime: 45 },
    { name: 'Romanian Deadlift', description: 'Hamstring focused hip hinge', muscleGroup: 'Legs', equipment: 'Barbell or Dumbbells', instructions: 'Hinge at hips with slight knee bend. Lower weight along legs, feel hamstring stretch, return.', sets: 3, reps: 10, restTime: 60 },
    { name: 'Mountain Climbers', description: 'Dynamic core and cardio exercise', muscleGroup: 'Core', equipment: 'None', instructions: 'Start in push-up position. Drive knees alternately towards chest in running motion.', sets: 3, reps: 30, restTime: 30 },
  ];

  const insertExercise = db.prepare(`INSERT INTO exercises (id, clientId, clientName, name, description, muscleGroup, equipment, instructions, sets, reps, restTime, videoUrl, creationType, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', datetime('now'))`);
  exercises.forEach((exercise, index) => {
    const clientIndex = index % clientIds.length;
    insertExercise.run(uuidv4(), clientIds[clientIndex], clients[clientIndex].name, exercise.name, exercise.description, exercise.muscleGroup, exercise.equipment, exercise.instructions, exercise.sets, exercise.reps, exercise.restTime, '/videos/exercise-placeholder.mp4');
  });

  // ========== Seed Meal Plans (15 items) ==========
  console.log('Seeding meal plans...');
  const mealPlans = [
    { name: 'Weight Loss Starter', description: 'Calorie-controlled plan for sustainable weight loss', category: 'Weight Loss', calories: 1500, protein: 120, carbs: 150, fat: 50, meals: 'Breakfast: Oatmeal with berries; Lunch: Grilled chicken salad; Dinner: Salmon with vegetables', duration: '4 weeks', targetGoal: 'Lose 1-2 lbs per week' },
    { name: 'Muscle Building', description: 'High protein plan for muscle growth', category: 'Muscle Gain', calories: 2800, protein: 200, carbs: 300, fat: 90, meals: 'Breakfast: Eggs and toast; Lunch: Chicken and rice; Dinner: Steak with sweet potato', duration: '8 weeks', targetGoal: 'Gain lean muscle mass' },
    { name: 'Keto Plan', description: 'Low carb, high fat ketogenic diet', category: 'Keto', calories: 1800, protein: 100, carbs: 25, fat: 150, meals: 'Breakfast: Bacon and eggs; Lunch: Avocado chicken salad; Dinner: Grilled fish with asparagus', duration: '6 weeks', targetGoal: 'Enter ketosis, fat adaptation' },
    { name: 'Vegan Power', description: 'Plant-based nutrition for active individuals', category: 'Vegan', calories: 2200, protein: 80, carbs: 280, fat: 80, meals: 'Breakfast: Smoothie bowl; Lunch: Quinoa Buddha bowl; Dinner: Lentil curry with rice', duration: '4 weeks', targetGoal: 'Plant-based fitness' },
    { name: 'Mediterranean Diet', description: 'Heart-healthy Mediterranean eating pattern', category: 'Heart Health', calories: 2000, protein: 90, carbs: 220, fat: 80, meals: 'Breakfast: Greek yogurt; Lunch: Hummus wrap; Dinner: Grilled fish with olive oil vegetables', duration: '12 weeks', targetGoal: 'Improve heart health' },
    { name: 'Athlete Performance', description: 'Optimized nutrition for competitive athletes', category: 'Performance', calories: 3500, protein: 180, carbs: 450, fat: 100, meals: 'Breakfast: Pancakes with eggs; Lunch: Pasta with chicken; Dinner: Rice bowl with fish', duration: '8 weeks', targetGoal: 'Peak athletic performance' },
    { name: 'Diabetes Friendly', description: 'Blood sugar management meal plan', category: 'Medical', calories: 1800, protein: 100, carbs: 180, fat: 70, meals: 'Breakfast: Eggs with whole grain toast; Lunch: Turkey lettuce wraps; Dinner: Grilled chicken with vegetables', duration: '12 weeks', targetGoal: 'Stable blood sugar levels' },
    { name: 'Intermittent Fasting', description: '16:8 intermittent fasting protocol', category: 'Fasting', calories: 1600, protein: 100, carbs: 160, fat: 60, meals: 'Eating window 12-8pm; Meal 1: Large lunch; Meal 2: Regular dinner; Snack optional', duration: '6 weeks', targetGoal: 'Metabolic flexibility' },
    { name: 'Clean Eating', description: 'Whole foods focus, minimal processing', category: 'General Health', calories: 2000, protein: 110, carbs: 220, fat: 70, meals: 'Breakfast: Overnight oats; Lunch: Grain bowl; Dinner: Roasted chicken with roasted vegetables', duration: '8 weeks', targetGoal: 'Overall health improvement' },
    { name: 'Post-Workout Recovery', description: 'Optimized for muscle recovery and growth', category: 'Recovery', calories: 2400, protein: 150, carbs: 280, fat: 80, meals: 'Focus on post-workout protein shake and carb-rich recovery meals', duration: '4 weeks', targetGoal: 'Enhanced recovery' },
    { name: 'Pregnancy Nutrition', description: 'Nutrient-dense plan for expecting mothers', category: 'Prenatal', calories: 2200, protein: 100, carbs: 260, fat: 80, meals: 'Balanced meals with folate, iron, and calcium focus; Small frequent meals', duration: '9 months', targetGoal: 'Healthy pregnancy' },
    { name: 'Senior Wellness', description: 'Nutrition optimized for older adults', category: 'Senior', calories: 1800, protein: 90, carbs: 200, fat: 70, meals: 'Easily digestible meals; Focus on bone health and protein preservation', duration: '12 weeks', targetGoal: 'Healthy aging' },
    { name: 'Anti-Inflammatory', description: 'Reduce inflammation through diet', category: 'Therapeutic', calories: 1900, protein: 100, carbs: 200, fat: 80, meals: 'Focus on omega-3s, turmeric, leafy greens; Avoid processed foods', duration: '8 weeks', targetGoal: 'Reduce inflammation markers' },
    { name: 'Budget Friendly Fit', description: 'Nutritious eating on a budget', category: 'Budget', calories: 2000, protein: 100, carbs: 240, fat: 70, meals: 'Eggs, beans, rice, seasonal vegetables; Batch cooking emphasis', duration: '4 weeks', targetGoal: 'Affordable nutrition' },
    { name: 'Gut Health Reset', description: 'Improve digestive health and microbiome', category: 'Digestive', calories: 1800, protein: 80, carbs: 200, fat: 70, meals: 'Fermented foods, fiber-rich vegetables, bone broth; Probiotic focus', duration: '6 weeks', targetGoal: 'Improved gut health' },
  ];

  const insertMealPlan = db.prepare(`INSERT INTO meal_plans (id, clientId, clientName, name, description, category, calories, protein, carbs, fat, meals, duration, targetGoal, creationType, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', datetime('now'))`);
  mealPlans.forEach((plan, index) => {
    const clientIndex = index % clientIds.length;
    insertMealPlan.run(uuidv4(), clientIds[clientIndex], clients[clientIndex].name, plan.name, plan.description, plan.category, plan.calories, plan.protein, plan.carbs, plan.fat, plan.meals, plan.duration, plan.targetGoal);
  });

  // ========== Seed Recipes (15 items) ==========
  console.log('Seeding recipes...');
  const recipes = [
    { name: 'Grilled Chicken Salad', description: 'Fresh and protein-packed salad', category: 'Lunch', calories: 350, protein: 40, carbs: 15, fat: 15, ingredients: 'Chicken breast, Mixed greens, Tomatoes, Cucumber, Olive oil, Lemon', instructions: 'Grill chicken, slice. Toss greens with vegetables. Top with chicken and dressing.', prepTime: 15, cookTime: 20, servings: 1 },
    { name: 'Overnight Oats', description: 'Easy make-ahead breakfast', category: 'Breakfast', calories: 400, protein: 15, carbs: 55, fat: 12, ingredients: 'Oats, Greek yogurt, Milk, Honey, Berries, Chia seeds', instructions: 'Mix all ingredients in jar. Refrigerate overnight. Top with fresh berries.', prepTime: 5, cookTime: 0, servings: 1 },
    { name: 'Salmon with Asparagus', description: 'Heart-healthy dinner option', category: 'Dinner', calories: 450, protein: 45, carbs: 12, fat: 25, ingredients: 'Salmon fillet, Asparagus, Olive oil, Garlic, Lemon, Dill', instructions: 'Season salmon, roast at 400F for 15 mins with asparagus.', prepTime: 10, cookTime: 15, servings: 1 },
    { name: 'Protein Smoothie', description: 'Post-workout recovery drink', category: 'Snack', calories: 300, protein: 30, carbs: 35, fat: 5, ingredients: 'Protein powder, Banana, Spinach, Almond milk, Peanut butter', instructions: 'Blend all ingredients until smooth. Add ice if desired.', prepTime: 5, cookTime: 0, servings: 1 },
    { name: 'Quinoa Buddha Bowl', description: 'Nutrient-dense vegetarian meal', category: 'Lunch', calories: 500, protein: 18, carbs: 65, fat: 20, ingredients: 'Quinoa, Chickpeas, Avocado, Kale, Sweet potato, Tahini', instructions: 'Cook quinoa. Roast chickpeas and sweet potato. Assemble and drizzle with tahini.', prepTime: 15, cookTime: 30, servings: 1 },
    { name: 'Turkey Meatballs', description: 'Lean protein dinner', category: 'Dinner', calories: 380, protein: 35, carbs: 25, fat: 16, ingredients: 'Ground turkey, Egg, Breadcrumbs, Garlic, Italian herbs, Marinara', instructions: 'Mix turkey with egg and seasonings. Form balls, bake at 375F for 20 mins.', prepTime: 15, cookTime: 20, servings: 2 },
    { name: 'Greek Yogurt Parfait', description: 'Protein-rich breakfast or snack', category: 'Breakfast', calories: 280, protein: 20, carbs: 35, fat: 8, ingredients: 'Greek yogurt, Granola, Honey, Mixed berries, Almonds', instructions: 'Layer yogurt, granola, and berries in glass. Drizzle with honey.', prepTime: 5, cookTime: 0, servings: 1 },
    { name: 'Stir-Fry Vegetables', description: 'Quick and healthy Asian-inspired dish', category: 'Dinner', calories: 320, protein: 25, carbs: 30, fat: 12, ingredients: 'Chicken or tofu, Broccoli, Bell peppers, Snap peas, Soy sauce, Ginger', instructions: 'Stir-fry protein, add vegetables. Season with soy and ginger. Serve over rice.', prepTime: 15, cookTime: 10, servings: 2 },
    { name: 'Egg White Omelette', description: 'Low-calorie high-protein breakfast', category: 'Breakfast', calories: 180, protein: 25, carbs: 5, fat: 6, ingredients: 'Egg whites, Spinach, Mushrooms, Tomatoes, Feta cheese', instructions: 'Whisk egg whites. Pour in pan, add vegetables and cheese. Fold when set.', prepTime: 5, cookTime: 8, servings: 1 },
    { name: 'Lentil Soup', description: 'Hearty and nutritious soup', category: 'Lunch', calories: 350, protein: 18, carbs: 50, fat: 8, ingredients: 'Lentils, Carrots, Celery, Onion, Garlic, Vegetable broth, Cumin', instructions: 'Saute vegetables, add lentils and broth. Simmer 30 mins until tender.', prepTime: 15, cookTime: 35, servings: 4 },
    { name: 'Avocado Toast', description: 'Simple and satisfying breakfast', category: 'Breakfast', calories: 320, protein: 12, carbs: 30, fat: 18, ingredients: 'Whole grain bread, Avocado, Eggs, Cherry tomatoes, Everything bagel seasoning', instructions: 'Toast bread, mash avocado on top. Add poached egg and seasonings.', prepTime: 5, cookTime: 5, servings: 1 },
    { name: 'Grilled Fish Tacos', description: 'Light and flavorful dinner', category: 'Dinner', calories: 400, protein: 35, carbs: 35, fat: 14, ingredients: 'White fish, Corn tortillas, Cabbage, Lime crema, Cilantro, Lime', instructions: 'Season and grill fish. Assemble tacos with slaw and crema.', prepTime: 15, cookTime: 10, servings: 2 },
    { name: 'Protein Energy Balls', description: 'No-bake healthy snack', category: 'Snack', calories: 150, protein: 8, carbs: 18, fat: 7, ingredients: 'Oats, Peanut butter, Honey, Protein powder, Dark chocolate chips', instructions: 'Mix all ingredients. Roll into balls. Refrigerate 30 mins.', prepTime: 15, cookTime: 0, servings: 12 },
    { name: 'Chicken Breast with Sweet Potato', description: 'Classic fitness meal', category: 'Dinner', calories: 480, protein: 45, carbs: 45, fat: 12, ingredients: 'Chicken breast, Sweet potato, Broccoli, Olive oil, Herbs', instructions: 'Bake chicken and sweet potato at 400F for 25 mins. Steam broccoli.', prepTime: 10, cookTime: 25, servings: 1 },
    { name: 'Green Detox Smoothie', description: 'Refreshing and cleansing drink', category: 'Breakfast', calories: 220, protein: 8, carbs: 40, fat: 5, ingredients: 'Spinach, Kale, Banana, Apple, Ginger, Lemon, Coconut water', instructions: 'Blend all ingredients until smooth. Serve immediately.', prepTime: 5, cookTime: 0, servings: 1 },
  ];

  const insertRecipe = db.prepare(`INSERT INTO recipes (id, clientId, clientName, name, description, category, calories, protein, carbs, fat, ingredients, instructions, prepTime, cookTime, servings, imageUrl, creationType, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', datetime('now'))`);
  recipes.forEach((recipe, index) => {
    const clientIndex = index % clientIds.length;
    insertRecipe.run(uuidv4(), clientIds[clientIndex], clients[clientIndex].name, recipe.name, recipe.description, recipe.category, recipe.calories, recipe.protein, recipe.carbs, recipe.fat, recipe.ingredients, recipe.instructions, recipe.prepTime, recipe.cookTime, recipe.servings, '/images/recipe-placeholder.jpg');
  });

  // ========== Seed Wellness Goals (15 items) ==========
  console.log('Seeding wellness goals...');
  const wellnessGoals = [
    { clientIndex: 0, goalType: 'Weight Loss', title: 'Lose 20 pounds', description: 'Achieve healthy weight through diet and exercise', targetValue: 180, currentValue: 195, unit: 'lbs', status: 'in_progress' },
    { clientIndex: 1, goalType: 'Flexibility', title: 'Touch toes', description: 'Improve hamstring flexibility', targetValue: 100, currentValue: 60, unit: '% flexibility', status: 'in_progress' },
    { clientIndex: 2, goalType: 'Endurance', title: 'Run marathon', description: 'Complete first marathon under 4 hours', targetValue: 26.2, currentValue: 15, unit: 'miles', status: 'in_progress' },
    { clientIndex: 3, goalType: 'Strength', title: 'Improve bone density', description: 'Weight-bearing exercises for osteoporosis', targetValue: 12, currentValue: 8, unit: 'sessions/month', status: 'in_progress' },
    { clientIndex: 4, goalType: 'Muscle Gain', title: 'Gain 15 lbs muscle', description: 'Clean bulk over 6 months', targetValue: 185, currentValue: 172, unit: 'lbs lean mass', status: 'in_progress' },
    { clientIndex: 5, goalType: 'Recovery', title: 'Core rehabilitation', description: 'Heal diastasis recti through targeted exercises', targetValue: 1, currentValue: 2.5, unit: 'finger gap', status: 'in_progress' },
    { clientIndex: 6, goalType: 'Health', title: 'Lower cholesterol', description: 'Reduce LDL through diet and exercise', targetValue: 100, currentValue: 145, unit: 'mg/dL', status: 'in_progress' },
    { clientIndex: 7, goalType: 'Strength', title: 'First pull-up', description: 'Build upper body strength for unassisted pull-up', targetValue: 1, currentValue: 0, unit: 'reps', status: 'in_progress' },
    { clientIndex: 8, goalType: 'Health', title: 'Control blood sugar', description: 'Maintain A1C below 6.5', targetValue: 6.5, currentValue: 7.2, unit: 'A1C %', status: 'in_progress' },
    { clientIndex: 9, goalType: 'Sleep', title: 'Improve sleep quality', description: '7+ hours quality sleep per night', targetValue: 7, currentValue: 5.5, unit: 'hours', status: 'in_progress' },
    { clientIndex: 10, goalType: 'Energy', title: 'Boost energy levels', description: 'Consistent energy throughout the day', targetValue: 8, currentValue: 4, unit: 'energy score', status: 'in_progress' },
    { clientIndex: 11, goalType: 'Mobility', title: 'Daily movement', description: 'Walk 30 mins daily for joint health', targetValue: 30, currentValue: 15, unit: 'mins/day', status: 'in_progress' },
    { clientIndex: 12, goalType: 'Performance', title: 'Improve vertical jump', description: 'Increase vertical leap for basketball', targetValue: 32, currentValue: 26, unit: 'inches', status: 'in_progress' },
    { clientIndex: 0, goalType: 'Nutrition', title: 'Track macros', description: 'Consistently hit macro targets', targetValue: 30, currentValue: 22, unit: 'days streak', status: 'in_progress' },
    { clientIndex: 14, goalType: 'Stress', title: 'Reduce stress', description: 'Lower stress through meditation and exercise', targetValue: 3, currentValue: 7, unit: 'stress level', status: 'in_progress' },
  ];

  const insertGoal = db.prepare(`INSERT INTO wellness_goals (id, clientId, clientName, goalType, title, description, targetValue, currentValue, unit, startDate, targetDate, status, notes, creationType, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now', '-30 days'), date('now', '+60 days'), ?, '', 'manual', datetime('now'), datetime('now'))`);
  wellnessGoals.forEach(goal => {
    insertGoal.run(uuidv4(), clientIds[goal.clientIndex], clients[goal.clientIndex].name, goal.goalType, goal.title, goal.description, goal.targetValue, goal.currentValue, goal.unit, goal.status);
  });

  // ========== Seed Appointments (15 items) ==========
  console.log('Seeding appointments...');
  const appointmentTypes = ['Initial Consultation', 'Follow-up', 'Training Session', 'Nutrition Review', 'Progress Check', 'Goal Setting'];
  const locations = ['Main Studio', 'Online/Zoom', 'Gym Floor', 'Nutrition Office', 'Conference Room A'];

  const insertAppointment = db.prepare(`INSERT INTO appointments (id, clientId, clientName, coachName, appointmentType, date, time, duration, status, notes, location, creationType, createdAt) VALUES (?, ?, ?, ?, ?, date('now', ?), ?, ?, ?, '', ?, 'manual', datetime('now'))`);

  for (let i = 0; i < 15; i++) {
    const clientIndex = i % clientIds.length;
    const coachIndex = i % coachIds.length;
    const dayOffset = Math.floor(i / 3) - 2;
    const hour = 9 + (i % 8);
    const status = dayOffset < 0 ? 'completed' : 'scheduled';
    insertAppointment.run(
      uuidv4(), clientIds[clientIndex], clients[clientIndex].name, coaches[coachIndex].name,
      appointmentTypes[i % appointmentTypes.length],
      `${dayOffset >= 0 ? '+' : ''}${dayOffset} days`,
      `${hour.toString().padStart(2, '0')}:00`,
      [30, 45, 60][i % 3], status,
      locations[i % locations.length]
    );
  }

  // ========== Seed Progress Logs (15 items) ==========
  console.log('Seeding progress logs...');
  const insertProgressLog = db.prepare(`INSERT INTO progress_logs (id, clientId, clientName, date, weight, bodyFat, muscleMass, waterIntake, sleepHours, energyLevel, stressLevel, notes, creationType, createdAt) VALUES (?, ?, ?, date('now', ?), ?, ?, ?, ?, ?, ?, ?, '', 'manual', datetime('now'))`);

  for (let i = 0; i < 15; i++) {
    const clientIndex = i % clientIds.length;
    insertProgressLog.run(
      uuidv4(), clientIds[clientIndex], clients[clientIndex].name,
      `-${i * 3} days`,
      (150 + Math.random() * 50).toFixed(1),
      (15 + Math.random() * 15).toFixed(1),
      (60 + Math.random() * 30).toFixed(1),
      (6 + Math.random() * 4).toFixed(1),
      (5 + Math.random() * 4).toFixed(1),
      Math.floor(4 + Math.random() * 6),
      Math.floor(2 + Math.random() * 7)
    );
  }

  console.log('\nDatabase seeded successfully!');
  console.log('Summary:');
  console.log('- 15 Roles');
  console.log('- 15 Users');
  console.log('- 15 Notifications');
  console.log('- 15 Coaches');
  console.log('- 15 Clients');
  console.log('- 15 Workouts');
  console.log('- 15 Exercises');
  console.log('- 15 Meal Plans');
  console.log('- 15 Recipes');
  console.log('- 15 Wellness Goals');
  console.log('- 15 Appointments');
  console.log('- 15 Progress Logs');
  console.log('Total: 180 records across 12 tables');

  closeDb();
}

seedDatabase();
