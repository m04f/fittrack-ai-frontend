
import { useEffect } from "react";
import LoginForm from "@/components/Auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated && !isLoading) {
      console.log("User already authenticated, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fitness-50 to-white p-4">
      <LoginForm />
    </div>
  );
};

export default Login;
