export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  goals: string;
  healthConditions: string;
  startDate: string;
  status: 'active' | 'inactive' | 'pending';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workout {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  caloriesBurned: number;
  exercises: string;
  imageUrl: string;
  creationType: 'manual' | 'ai';
  createdAt: string;
}

export interface Exercise {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string;
  muscleGroup: string;
  equipment: string;
  instructions: string;
  sets: number;
  reps: number;
  restTime: number;
  videoUrl: string;
  creationType: 'manual' | 'ai';
  createdAt: string;
}

export interface MealPlan {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: string;
  duration: string;
  targetGoal: string;
  creationType: 'manual' | 'ai';
  createdAt: string;
}

export interface Recipe {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string;
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  imageUrl: string;
  creationType: 'manual' | 'ai';
  createdAt: string;
}

export interface WellnessGoal {
  id: string;
  clientId: string;
  clientName: string;
  goalType: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: 'in_progress' | 'completed' | 'paused';
  notes: string;
  creationType: 'manual' | 'ai';
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  coachName: string;
  appointmentType: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes: string;
  location: string;
  creationType: 'manual' | 'ai';
  createdAt: string;
}

export interface ProgressLog {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  weight: number;
  bodyFat: number;
  muscleMass: number;
  waterIntake: number;
  sleepHours: number;
  energyLevel: number;
  stressLevel: number;
  notes: string;
  creationType: 'manual' | 'ai';
  createdAt: string;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  specialization: string;
  certifications: string;
  experience: number;
  bio: string;
  availability: string;
  rating: number;
  imageUrl: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'coach' | 'client' | 'viewer';
  avatar: string;
  phone: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  link: string;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}
