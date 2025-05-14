
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const RequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();

  console.log("RequireAuth state:", { isAuthenticated, isLoading });

  if (isLoading) {
    console.log("Auth is loading, showing skeleton");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("Authenticated, rendering protected content");
  return <Outlet />;
};

export default RequireAuth;
