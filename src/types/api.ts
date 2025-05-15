
// API Types for the fitness app

// Auth Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  fullname: string;
}

export interface UserInfo extends User {
  bio: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  bmi: number | null;
  fitness_level: "beginner" | "intermediate" | "advanced" | null;
  fitness_goal: "lose weight" | "gain weight" | "maintain weight" | null;
  frontend_settings: Record<string, any>;
}

export interface AuthResponse {
  auth_token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegistrationData extends LoginCredentials {
  email: string;
}

// Exercise Types
export interface Muscle {
  name: string;
  description: string | null;
  exercises: string[];
}

export interface Exercise {
  name: string;
  description: string | null;
  muscles: string[];
}

// Workout Types
export interface WorkoutExercise {
  uuid: string;
  exercise: string;
  order: number;
  duration?: number | null;
  reps?: number | null;
  weight?: number | null;
  sets: number;
  rest: number;
  notes?: string;
}

export interface Workout {
  uuid: string;
  name: string;
  creator: string;
  description: string | null;
  notes: string | null;
  public: boolean;
  exercises: WorkoutExercise[] | null;
  exercise_urls: string[];
  total_duration: number;
}

export interface WorkoutList {
  results: Workout[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Record Types
export interface ExerciseRecord {
  uuid: string;
  exercise: string;
  reps?: number | null;
  weight?: number | null;
  pre?: number | null;
  datetime: string;
  rest?: number | null;
  duration?: number | null;
}

export interface WorkoutRecord {
  uuid: string;
  workout: string;
  exercises: ExerciseRecord[];
  planday?: string | null;
}

// Plan Types
export interface PlanWorkout {
  uuid: string;
  workout: string;
  day: number;
  notes: string | null;
}

export interface Plan {
  uuid: string;
  creator: string;
  name: string;
  description: string | null;
  workouts: PlanWorkout[];
  public: boolean;
}

export interface PlanUser {
  uuid: string;
  plan: string;
  workouts: ExerciseRecord[];
  start_date: string;
}

// Chat Types
export interface Message {
  id: number;
  content: string;
  role: "user" | "system" | "assistant" | "tool";
  timestamp: string;
}

export interface ChatSession {
  uuid: string;
  title: string;
  created_at: string;
  details: string;
}

export interface DetailedChatSession extends ChatSession {
  messages: Message[];
}
