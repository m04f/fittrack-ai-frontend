
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Dumbbell, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.username, values.password);
      toast.success("Welcome back!");
    } catch (error) {
      toast.error("Invalid credentials. Please try again.");
      console.error("Login failed:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-0 fitness-card">
      <CardHeader className="text-center pb-8">
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-full fitness-icon-bg">
            <Dumbbell className="h-10 w-10 text-fitness-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold fitness-gradient-text">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground mt-2">
          Sign in to continue your fitness journey
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="Enter your username"
                        className="pl-10 h-12 border-2 transition-all duration-200 fitness-focus"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-12 border-2 transition-all duration-200 fitness-focus"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-12 fitness-button-primary text-lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-fitness-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="pt-6 border-t fitness-border-light">
        <div className="w-full text-center">
          <div className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link 
              to="/register" 
              className="font-semibold fitness-text-primary hover:brightness-90 transition-colors duration-200"
            >
              Create one now
            </Link>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
