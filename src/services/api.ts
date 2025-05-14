
import { toast } from "sonner";

// API Configuration
const API_BASE_URL = "/api";

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
      const response = await fetch(url, {
        ...options,
        headers,
      });

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

        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username: string, password: string) {
    const data = await this.request<{ auth_token: string }>("/auth/token/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.auth_token);
    return data;
  }

  async register(username: string, email: string, password: string) {
    return this.request("/auth/users/", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  }

  async logout() {
    await this.request("/auth/token/logout/", {
      method: "POST",
    });
    this.clearToken();
  }

  async getUserInfo() {
    return this.request("/user/");
  }

  async updateUserInfo(data: any) {
    return this.request("/user/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Exercise endpoints
  async getExercises(params = "") {
    return this.request(`/exercises/${params}`);
  }

  async getExercise(name: string) {
    return this.request(`/exercises/${name}`);
  }

  // Workout endpoints
  async getWorkouts() {
    return this.request("/workouts/");
  }

  async getWorkout(uuid: string) {
    return this.request(`/workouts/${uuid}/`);
  }

  async createWorkout(data: any) {
    return this.request("/workouts/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateWorkout(uuid: string, data: any) {
    return this.request(`/workouts/${uuid}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteWorkout(uuid: string) {
    return this.request(`/workouts/${uuid}/`, {
      method: "DELETE",
    });
  }

  // Records endpoints
  async getWorkoutRecords() {
    return this.request("/user/workouts/");
  }

  async createWorkoutRecord(data: any) {
    return this.request("/user/workouts/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Plan endpoints
  async getPlans() {
    return this.request("/plans/");
  }

  async getPlan(uuid: string) {
    return this.request(`/plans/${uuid}/`);
  }

  async getUserPlans() {
    return this.request("/user/plans/");
  }

  // Chat endpoints
  async getChatSessions() {
    return this.request("/chat/sessions/");
  }

  async getChatSession(uuid: string) {
    return this.request(`/chat/sessions/${uuid}/`);
  }

  async createChatSession(title: string) {
    return this.request("/chat/sessions/", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  }
}

const api = new ApiService();
export default api;
