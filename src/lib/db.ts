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

  // Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      firstName TEXT,
      lastName TEXT,
      role TEXT DEFAULT 'viewer',
      avatar TEXT,
      phone TEXT,
      isActive INTEGER DEFAULT 1,
      lastLogin TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Roles table
  database.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      permissions TEXT,
      isDefault INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Notifications table
  database.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT,
      title TEXT NOT NULL,
      message TEXT,
      type TEXT DEFAULT 'info',
      isRead INTEGER DEFAULT 0,
      link TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

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
      creationType TEXT DEFAULT 'manual',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  try { database.exec(`ALTER TABLE workouts ADD COLUMN clientId TEXT`); } catch (e) { /* exists */ }
  try { database.exec(`ALTER TABLE workouts ADD COLUMN clientName TEXT`); } catch (e) { /* exists */ }
  try { database.exec(`ALTER TABLE workouts ADD COLUMN creationType TEXT DEFAULT 'manual'`); } catch (e) { /* exists */ }

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
      creationType TEXT DEFAULT 'manual',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  try { database.exec(`ALTER TABLE exercises ADD COLUMN clientId TEXT`); } catch (e) { /* exists */ }
  try { database.exec(`ALTER TABLE exercises ADD COLUMN clientName TEXT`); } catch (e) { /* exists */ }
  try { database.exec(`ALTER TABLE exercises ADD COLUMN creationType TEXT DEFAULT 'manual'`); } catch (e) { /* exists */ }

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
      creationType TEXT DEFAULT 'manual',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  try { database.exec(`ALTER TABLE meal_plans ADD COLUMN clientId TEXT`); } catch (e) { /* exists */ }
  try { database.exec(`ALTER TABLE meal_plans ADD COLUMN clientName TEXT`); } catch (e) { /* exists */ }
  try { database.exec(`ALTER TABLE meal_plans ADD COLUMN creationType TEXT DEFAULT 'manual'`); } catch (e) { /* exists */ }

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
      creationType TEXT DEFAULT 'manual',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  try { database.exec(`ALTER TABLE recipes ADD COLUMN clientId TEXT`); } catch (e) { /* exists */ }
  try { database.exec(`ALTER TABLE recipes ADD COLUMN clientName TEXT`); } catch (e) { /* exists */ }
  try { database.exec(`ALTER TABLE recipes ADD COLUMN creationType TEXT DEFAULT 'manual'`); } catch (e) { /* exists */ }

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
      creationType TEXT DEFAULT 'manual',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  try { database.exec(`ALTER TABLE wellness_goals ADD COLUMN creationType TEXT DEFAULT 'manual'`); } catch (e) { /* exists */ }

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
      creationType TEXT DEFAULT 'manual',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  try { database.exec(`ALTER TABLE appointments ADD COLUMN creationType TEXT DEFAULT 'manual'`); } catch (e) { /* exists */ }

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
      creationType TEXT DEFAULT 'manual',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id)
    )
  `);

  try { database.exec(`ALTER TABLE progress_logs ADD COLUMN creationType TEXT DEFAULT 'manual'`); } catch (e) { /* exists */ }

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
