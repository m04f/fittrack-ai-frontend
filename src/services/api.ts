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
  UserPlan,
  UserPlanWorkout,
  PlanWorkout,
  Message,
} from "@/types/api";

// API Configuration
// Use the proxy in development, direct URL in production
const API_BASE_URL = "https://fit-track-ai.vercel.app/api";

// API Service for making authenticated requests to the Django backend
class ApiService {
  private token: string | null = null;
  private ws: WebSocket | null = null;

  constructor() {
    // Check if token exists in localStorage
    this.token = localStorage.getItem("fitness_token");
  }

  connectWebSocket(
    sessionId: string,
    onMessage: (data: any) => void,
    onError?: (error: Event) => void,
    onClose?: () => void,
  ) {
    if (this.ws) {
      this.ws.close();
    }
    this.ws = new WebSocket(
      `wss://fit-track-ai.vercel.app/ws/chat/sessions/${sessionId}/`,
    );

    this.ws.onopen = () => {
      console.log("WebSocket connected");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      if (onError) onError(error);
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      if (onClose) onClose();
    };
  }

  sendWebSocketMessage(message: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ message }));
    } else {
      console.error("WebSocket is not open");
    }
  }

  closeWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
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
        credentials: "omit",
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
    return this.request<WorkoutRecord[]>("/user/workouts/");
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

  async setPlanWorkoutRecord(data: {
    record: string;
    plan: string;
    workout: string;
  }) {
    return this.request<UserPlanWorkout>(
      `/user/plans/${data.plan}/workouts/${data.workout}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          uuid: data.workout,
          record: data.record,
        }),
      },
    );
  }

  // Plan endpoints
  async getPlans() {
    return this.request<Plan[]>("/plans/");
  }

  async getPlan(uuid: string) {
    return this.request<Plan>(`/plans/${uuid}/`);
  }

  // User Plans endpoints
  async getUserPlans() {
    return this.request<UserPlan[]>("/user/plans/");
  }

  async enrollInPlan(planUuid: string) {
    return this.request<UserPlan>("/user/plans/", {
      method: "POST",
      body: JSON.stringify({ plan: planUuid }),
    });
  }

  async unenrollFromPlan(planId: string) {
    return this.request<void>(`/user/plans/${planId}/`, {
      method: "DELETE",
    });
  }

  async updateUserPlanWorkout(
    planUuid: string,
    workoutUuid: string,
    data: { record: string },
  ) {
    return this.request<UserPlanWorkout>(
      `/user/plans/${planUuid}/workouts/${workoutUuid}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  }

  // Chat endpoints
  async getChatSessions() {
    return this.request<ChatSession[]>("/chat/sessions/");
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

  async deleteChatSession(uuid: string) {
    return this.request<void>(`/chat/sessions/${uuid}/`, {
      method: "DELETE",
    });
  }

  async sendChatMessage(sessionId: string, message: Message) {
    return this.request<Message>(`/chat/sessions/${sessionId}/messages/`, {
      method: "POST",
      body: JSON.stringify({
        role: message.role,
        content: message.content,
      }),
    });
  }
}

const api = new ApiService();
export default api;
