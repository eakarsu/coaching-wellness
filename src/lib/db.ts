import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'wellness.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initializeDb(): void {
  const database = getDb();

  // Clients table
  database.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      age INTEGER,
      gender TEXT,
      goals TEXT,
      healthConditions TEXT,
      startDate TEXT,
      status TEXT DEFAULT 'active',
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Workouts table
  database.exec(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      clientId TEXT,
      clientName TEXT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      difficulty TEXT,
      duration INTEGER,
      caloriesBurned INTEGER,
      exercises TEXT,
      imageUrl TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  // Add clientId and clientName columns to workouts if they don't exist
  try {
    database.exec(`ALTER TABLE workouts ADD COLUMN clientId TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    database.exec(`ALTER TABLE workouts ADD COLUMN clientName TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    database.exec(`ALTER TABLE workouts ADD COLUMN creationType TEXT DEFAULT 'manual'`);
  } catch (e) { /* Column already exists */ }

  // Exercises table
  database.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      clientId TEXT,
      clientName TEXT,
      name TEXT NOT NULL,
      description TEXT,
      muscleGroup TEXT,
      equipment TEXT,
      instructions TEXT,
      sets INTEGER,
      reps INTEGER,
      restTime INTEGER,
      videoUrl TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  // Add clientId and clientName columns to exercises if they don't exist
  try {
    database.exec(`ALTER TABLE exercises ADD COLUMN clientId TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    database.exec(`ALTER TABLE exercises ADD COLUMN clientName TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    database.exec(`ALTER TABLE exercises ADD COLUMN creationType TEXT DEFAULT 'manual'`);
  } catch (e) { /* Column already exists */ }

  // Meal Plans table
  database.exec(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      clientId TEXT,
      clientName TEXT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      calories INTEGER,
      protein INTEGER,
      carbs INTEGER,
      fat INTEGER,
      meals TEXT,
      duration TEXT,
      targetGoal TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  // Add clientId and clientName columns if they don't exist (for existing databases)
  try {
    database.exec(`ALTER TABLE meal_plans ADD COLUMN clientId TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    database.exec(`ALTER TABLE meal_plans ADD COLUMN clientName TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    database.exec(`ALTER TABLE meal_plans ADD COLUMN creationType TEXT DEFAULT 'manual'`);
  } catch (e) { /* Column already exists */ }

  // Recipes table
  database.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      clientId TEXT,
      clientName TEXT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      calories INTEGER,
      protein INTEGER,
      carbs INTEGER,
      fat INTEGER,
      ingredients TEXT,
      instructions TEXT,
      prepTime INTEGER,
      cookTime INTEGER,
      servings INTEGER,
      imageUrl TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  // Add clientId and clientName columns to recipes if they don't exist
  try {
    database.exec(`ALTER TABLE recipes ADD COLUMN clientId TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    database.exec(`ALTER TABLE recipes ADD COLUMN clientName TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    database.exec(`ALTER TABLE recipes ADD COLUMN creationType TEXT DEFAULT 'manual'`);
  } catch (e) { /* Column already exists */ }

  // Wellness Goals table
  database.exec(`
    CREATE TABLE IF NOT EXISTS wellness_goals (
      id TEXT PRIMARY KEY,
      clientId TEXT,
      clientName TEXT,
      goalType TEXT,
      title TEXT NOT NULL,
      description TEXT,
      targetValue REAL,
      currentValue REAL,
      unit TEXT,
      startDate TEXT,
      targetDate TEXT,
      status TEXT DEFAULT 'in_progress',
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  // Add creationType column to wellness_goals if it doesn't exist
  try {
    database.exec(`ALTER TABLE wellness_goals ADD COLUMN creationType TEXT DEFAULT 'manual'`);
  } catch (e) { /* Column already exists */ }

  // Appointments table
  database.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      clientId TEXT,
      clientName TEXT,
      coachName TEXT,
      appointmentType TEXT,
      date TEXT,
      time TEXT,
      duration INTEGER,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      location TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  // Add creationType column to appointments if it doesn't exist
  try {
    database.exec(`ALTER TABLE appointments ADD COLUMN creationType TEXT DEFAULT 'manual'`);
  } catch (e) { /* Column already exists */ }

  // Progress Logs table
  database.exec(`
    CREATE TABLE IF NOT EXISTS progress_logs (
      id TEXT PRIMARY KEY,
      clientId TEXT,
      clientName TEXT,
      date TEXT,
      weight REAL,
      bodyFat REAL,
      muscleMass REAL,
      waterIntake REAL,
      sleepHours REAL,
      energyLevel INTEGER,
      stressLevel INTEGER,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  // Add creationType column to progress_logs if it doesn't exist
  try {
    database.exec(`ALTER TABLE progress_logs ADD COLUMN creationType TEXT DEFAULT 'manual'`);
  } catch (e) { /* Column already exists */ }

  // Coaches table
  database.exec(`
    CREATE TABLE IF NOT EXISTS coaches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      specialization TEXT,
      certifications TEXT,
      experience INTEGER,
      bio TEXT,
      availability TEXT,
      rating REAL,
      imageUrl TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
