import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center fitness-gradient-bg p-4">
      <Card className="fitness-card border-2 fitness-border-light/50 shadow-2xl max-w-md w-full">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full fitness-icon-bg">
              <Dumbbell className="h-10 w-10 text-fitness-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-6xl font-bold fitness-gradient-text mb-2">
            404
          </CardTitle>
          <p className="text-xl text-muted-foreground">Oops! Page not found</p>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button 
            asChild 
            className="fitness-button-primary font-semibold shadow-lg transition-all duration-200"
          >
            <a href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Return to Home
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
