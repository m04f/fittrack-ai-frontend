
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Dumbbell, CalendarCheck, Award, ArrowRight, Timer, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { WorkoutRecord, Workout } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { user } = useAuth();
  const [workoutRecords, setWorkoutRecords] = useState<WorkoutRecord[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [recordsData, workoutsData] = await Promise.all([
          api.getWorkoutRecords(),
          api.getWorkouts()
        ]);
        setWorkoutRecords(recordsData.results || []);
        setRecentWorkouts((workoutsData.results?.slice(0, 5) || []) as Workout[]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const workoutsThisWeek = 3; // Mock data, replace with real data later
  const weeklyGoal = 5; // Mock data, replace with real data later
  const weeklyProgress = (workoutsThisWeek / weeklyGoal) * 100;
  
  // Calculate streak (mock data for now)
  const streak = 4;

  return (
    <div className="animate-enter space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.fullname?.split(" ")[0] || user?.username}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your fitness journey
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workoutsThisWeek} / {weeklyGoal} workouts
            </div>
            <Progress value={weeklyProgress} className="mt-2 h-2 progress-gradient" />
            <p className="text-xs text-muted-foreground mt-2">
              {weeklyProgress.toFixed(0)}% of your weekly goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak} days</div>
            <p className="text-xs text-muted-foreground mt-2">
              You're on a roll! Keep it up.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Fitness Level
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {user?.fitness_level || "Not set"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {user?.fitness_level ? "Your current fitness level" : "Set your fitness level in profile"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Goal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {user?.fitness_goal || "Not set"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {user?.fitness_goal ? "Your current fitness goal" : "Set your fitness goal in profile"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Workouts</CardTitle>
            <CardDescription>Your latest completed workouts</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-2">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[160px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : workoutRecords.length > 0 ? (
              <div className="space-y-4">
                {workoutRecords.slice(0, 3).map((record) => (
                  <div key={record.uuid} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                    <div className="p-2 bg-secondary rounded-full">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Completed workout</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(record.exercises[0]?.datetime || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/workouts/${record.workout.split("/").slice(-2)[0]}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No workout records yet</p>
                <Link to="/record">
                  <Button className="mt-4 bg-fitness-600 hover:bg-fitness-700">Record a Workout</Button>
                </Link>
              </div>
            )}
            <Link to="/workouts" className="block text-sm text-fitness-600 mt-4 hover:underline">
              View all workouts
            </Link>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Workout Suggestions</CardTitle>
            <CardDescription>Recommended workouts for you</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-2">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[160px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentWorkouts.length > 0 ? (
              <div className="space-y-4">
                {recentWorkouts.slice(0, 3).map((workout) => (
                  <div key={workout.uuid} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                    <div className="p-2 bg-secondary rounded-full">
                      <Timer className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{workout.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {workout.exercises.length} exercises • By {workout.creator}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/workouts/${workout.uuid}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No workout suggestions available</p>
                <Link to="/chat">
                  <Button className="mt-4 bg-fitness-600 hover:bg-fitness-700">
                    Ask AI for suggestions
                  </Button>
                </Link>
              </div>
            )}
            <Link to="/chat" className="block text-sm text-fitness-600 mt-4 hover:underline">
              Get personalized recommendations from AI
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
