import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserInfo } from "@/types/api";

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
  updateUserInfo: (data: Partial<UserInfo>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (api.isAuthenticated()) {
        try {
          console.log("Checking auth status...");
          const userData = await api.getUserInfo();
          console.log("User data received:", userData);
          setUser(userData as UserInfo);
        } catch (error) {
          console.error("Error fetching user data:", error);
          api.clearToken();
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Attempting login for:", username);
      await api.login(username, password);
      console.log("Login successful, fetching user info...");
      const userData = await api.getUserInfo();
      console.log("User data received after login:", userData);
      setUser(userData as UserInfo);
      toast.success("Login successful!");

      // Add a small delay before navigation to ensure state is updated
      setTimeout(() => {
        navigate("/dashboard");
      }, 100);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ) => {
    setIsLoading(true);
    try {
      await api.register(username, email, password);
      console.log("Registration successful, attempting auto-login...");

      try {
        // Auto-login the user after successful registration
        await api.login(username, password);
        console.log("Auto-login successful, fetching user info...");
        const userData = await api.getUserInfo();
        console.log("User data received after auto-login:", userData);
        setUser(userData as UserInfo);

        toast.success("Registration successful! Welcome to FitTrack AI!");
        await api.enrollInPlan("29da674c-f915-426a-af4c-c55846ef1b18");

        // Add a small delay before navigation to ensure state is updated
        setTimeout(() => {
          navigate("/dashboard");
        }, 100);
      } catch (loginError) {
        console.error("Auto-login failed after registration:", loginError);
        // Fallback to manual login if auto-login fails
        toast.success(
          "Registration successful! Please log in with your new account.",
        );
        navigate("/login");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const updateUserInfo = async (data: Partial<UserInfo>): Promise<void> => {
    try {
      const updatedUser = await api.updateUserInfo(data);
      setUser(updatedUser);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating user info:", error);
      throw error;
    }
  };

  console.log("Auth state:", { isAuthenticated: !!user, isLoading, user });

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUserInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
