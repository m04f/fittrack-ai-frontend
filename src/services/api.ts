import { toast } from "sonner";
import {
  AuthResponse,
  LoginCredentials,
  RegistrationData,
  UserInfo,
  WorkoutList,
  Workout,
  WorkoutRecord,
  Plan,
  ExerciseRecord,
  UpdateWorkoutRecordPayload,
} from "@/types/api";

// API Configuration
// Use the proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.DEV ? "/api" : "http://localhost:8000/api";

// API Service for making authenticated requests to the Django backend
class ApiService {
  private token: string | null = null;

  constructor() {
    // Check if token exists in localStorage
    this.token = localStorage.getItem("fitness_token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("fitness_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("fitness_token");
  }

  isAuthenticated() {
    return !!this.token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Token ${this.token}` } : {}),
      ...options.headers,
    };

    try {
      console.log(`API Request: ${options.method || "GET"} ${url}`);

      const response = await fetch(url, {
        ...options,
        headers,
        // Add credentials to handle cookies if needed
        credentials: "include",
      });

      console.log(`API Response: ${response.status} for ${url}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = "An error occurred";
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        } else if (Object.keys(errorData).length > 0) {
          const firstError = Object.entries(errorData)[0];
          errorMessage = `${firstError[0]}: ${firstError[1]}`;
        }

        console.error(`API Error (${response.status}):`, errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return {} as T;
      }

      // Parse JSON safely
      const data = await response.json();
      console.log(`API Data:`, data);
      return data as T;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username: string, password: string) {
    const data = await this.request<AuthResponse>("/auth/token/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.auth_token);
    return data;
  }

  async register(username: string, email: string, password: string) {
    return this.request<{ id: number }>("/auth/users/", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  }

  async logout() {
    await this.request<void>("/auth/token/logout/", {
      method: "POST",
    });
    this.clearToken();
  }

  async getUserInfo(): Promise<UserInfo> {
    try {
      const data = await this.request<UserInfo>("/user/");
      console.log("User info fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("Error fetching user info:", error);
      throw error;
    }
  }

  async updateUserInfo(data: Partial<UserInfo>): Promise<UserInfo> {
    return this.request<UserInfo>("/user/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Exercise endpoints
  async getExercises(params = "") {
    return this.request<any>(`/exercises/${params}`);
  }

  async getExercise(name: string) {
    return this.request<any>(`/exercises/${name}`);
  }

  // Workout endpoints
  async getWorkouts() {
    return this.request<WorkoutList>("/workouts/");
  }

  async getWorkout(uuid: string) {
    return this.request<Workout>(`/workouts/${uuid}/`);
  }

  async createWorkout(data: any) {
    return this.request<Workout>("/workouts/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateWorkout(uuid: string, data: any) {
    return this.request<Workout>(`/workouts/${uuid}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteWorkout(uuid: string) {
    return this.request<void>(`/workouts/${uuid}/`, {
      method: "DELETE",
    });
  }

  // Records endpoints

  async patchWorkoutRecord(uuid: string, data: UpdateWorkoutRecordPayload) {
    return this.request<WorkoutRecord>(`/user/workouts/${uuid}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
  async getWorkoutRecords() {
    return this.request<{
      results: WorkoutRecord[];
      count: number;
      next: string | null;
      previous: string | null;
    }>("/user/workouts/");
  }

  async getUserWorkoutRecord(uuid: string) {
    return this.request<WorkoutRecord>(`/user/workouts/${uuid}/`);
  }

  async createWorkoutRecord(data: any) {
    return this.request<WorkoutRecord>("/user/workouts/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createExerciseRecord(data: any, workoutUuid?: string) {
    const endpoint = workoutUuid
      ? `/user/workouts/${workoutUuid}/exercises`
      : "/user/exercises/";
    return this.request<ExerciseRecord>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Plan endpoints
  async getPlans() {
    return this.request<Plan[]>("/plans/");
  }

  async getPlan(uuid: string) {
    return this.request<Plan>(`/plans/${uuid}/`);
  }

  async getUserPlans() {
    return this.request<any>("/user/plans/");
  }

  // Chat endpoints
  async getChatSessions() {
    return this.request<{
      results: ChatSession[];
      count: number;
      next: string | null;
      previous: string | null;
    }>("/chat/sessions/");
  }

  async getChatSession(uuid: string) {
    return this.request<DetailedChatSession>(`/chat/sessions/${uuid}/`);
  }

  async createChatSession(title: string) {
    return this.request<ChatSession>("/chat/sessions/", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  }
}

const api = new ApiService();
export default api;
