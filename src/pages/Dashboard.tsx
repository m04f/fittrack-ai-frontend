import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Dumbbell, 
  CalendarCheck, 
  Award, 
  ArrowRight, 
  Timer, 
  TrendingUp, 
  Users,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { WorkoutRecord, Workout, UserPlanWorkout } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, startOfWeek, endOfWeek, differenceInDays, isSameDay } from "date-fns";
import WorkoutCalendarHeatmap from "@/components/Dashboard/WorkoutCalendarHeatmap";

const Dashboard = () => {
  const { user } = useAuth();
  const [workoutRecords, setWorkoutRecords] = useState<WorkoutRecord[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<UserPlanWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(5); // Default weekly goal
  const [streak, setStreak] = useState(0);
  const [userPlans, setUserPlans] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [recordsData, workoutsData, plansData] = await Promise.all([
          api.getWorkoutRecords(),
          api.getWorkouts(),
          api.getUserPlans()
        ]);
        
        // Set workout records
        const records = recordsData || [];
        setWorkoutRecords(records);
        
        // Set recent workouts
        setRecentWorkouts((workoutsData.results?.slice(0, 5) || []) as Workout[]);
        
        // Set user plans
        setUserPlans(plansData || []);
        
        // Calculate workouts for this week
        calculateWeeklyProgress(records);
        
        // Calculate streak
        calculateStreak(records);
        
        // Find today's workout from user plans
        findTodayWorkout(plansData || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate weekly progress
  const calculateWeeklyProgress = (records: WorkoutRecord[]) => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    
    const thisWeekWorkouts = records.filter(record => {
      const recordDate = new Date(record.datetime);
      return recordDate >= weekStart && recordDate <= weekEnd;
    });
    
    setWorkoutsThisWeek(thisWeekWorkouts.length);
  };

  // Calculate workout streak
  const calculateStreak = (records: WorkoutRecord[]) => {
    if (!records.length) {
      setStreak(0);
      return;
    }

    // Sort records by date, newest first
    const sortedRecords = [...records].sort(
      (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );

    let currentStreak = 0;
    let previousDate: Date | null = null;
    
    // Check if there's a workout today
    const todayWorkout = sortedRecords.find(record => 
      isToday(new Date(record.datetime))
    );

    // Set the starting point for checking streak
    let currentDate = todayWorkout 
      ? new Date() 
      : new Date(sortedRecords[0].datetime);
    
    // Iterate through dates backwards from today or most recent workout
    for (let i = 0; i < sortedRecords.length; i++) {
      const recordDate = new Date(sortedRecords[i].datetime);
      
      if (previousDate === null) {
        // First record in the streak
        currentStreak = 1;
        previousDate = recordDate;
      } else {
        // Check if this workout is consecutive with the previous one
        const dayDifference = differenceInDays(previousDate, recordDate);
        if (dayDifference === 1) {
          // Consecutive day
          currentStreak++;
          previousDate = recordDate;
        } else if (dayDifference === 0) {
          // Same day, just continue to the next record
          previousDate = recordDate;
        } else {
          // Streak broken
          break;
        }
      }
    }

    setStreak(currentStreak);
  };

  // Find today's workout from user plans
  const findTodayWorkout = (plans: any[]) => {
    if (!plans.length) {
      setTodayWorkout(null);
      return;
    }

    const today = new Date();
    
    // Look through all plans for a workout scheduled today
    for (const plan of plans) {
      const todayWorkout = plan.workouts?.find((workout: UserPlanWorkout) => {
        const workoutDate = new Date(workout.date);
        return isSameDay(workoutDate, today);
      });
      
      if (todayWorkout) {
        setTodayWorkout(todayWorkout);
        return;
      }
    }
    
    setTodayWorkout(null);
  };

  const weeklyProgress = (workoutsThisWeek / weeklyGoal) * 100;
  
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
              {streak > 0 
                ? "You're on a roll! Keep it up." 
                : "Complete a workout today to start your streak!"}
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
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {workoutRecords.slice(0, 5).map((record) => (
                    <div key={record.uuid} className="flex flex-col gap-2 p-2 rounded-md hover:bg-muted">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary rounded-full">
                          <Dumbbell className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{record.workout_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(record.datetime).toLocaleDateString()}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/workout-record/${record.uuid}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      
                      {/* Exercise list for this workout record */}
                      <div className="ml-10 pl-2 border-l-2 border-secondary/50">
                        {record.exercises.slice(0, 3).map((exercise, idx) => (
                          <div key={exercise.uuid} className="text-sm py-1">
                            <span className="font-medium">{exercise.exercise.split('/').pop()}</span>
                            {" - "}
                            <span className="text-muted-foreground">
                              {exercise.reps && `${exercise.reps} reps`}
                              {exercise.weight && exercise.reps && ` · `}
                              {exercise.weight && `${exercise.weight} kg`}
                              {exercise.duration && !exercise.reps && !exercise.weight && `${Math.floor(exercise.duration / 60)}m ${exercise.duration % 60}s`}
                            </span>
                          </div>
                        ))}
                        {record.exercises.length > 3 && (
                          <div className="text-xs text-muted-foreground italic mt-1">
                            +{record.exercises.length - 3} more exercises
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No workout records yet</p>
                <Link to="/history">
                  <Button className="mt-4 bg-fitness-600 hover:bg-fitness-700">View Workout History</Button>
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
            <CardTitle>Today's Workout</CardTitle>
            <CardDescription>What's on your schedule for today</CardDescription>
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
            ) : todayWorkout ? (
              <div className="flex flex-col gap-4 p-2">
                <div className="flex items-center gap-3 rounded-md hover:bg-muted p-2">
                  <div className="p-2 bg-secondary rounded-full">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{todayWorkout.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Scheduled for today
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/workouts/${todayWorkout.workout.split("/").pop()}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                {!todayWorkout.record ? (
                  <Button asChild className="bg-fitness-600 hover:bg-fitness-700 w-full">
                    <Link to={`/workouts/${todayWorkout.workout.split("/").pop()}`}>
                      Start Workout
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/workout-record/${todayWorkout.record}`}>
                      View Completed Workout
                    </Link>
                  </Button>
                )}
              </div>
            ) : userPlans.length > 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-lg font-medium">Rest Day</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No workouts scheduled for today. Enjoy your rest!
                </p>
              </div>
            ) : recentWorkouts.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm mb-2">No plan for today. Here are some suggestions:</div>
                {recentWorkouts.slice(0, 3).map((workout) => (
                  <div key={workout.uuid} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                    <div className="p-2 bg-secondary rounded-full">
                      <Timer className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{workout.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {workout.exercises?.length || 0} exercises • By {workout.creator}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/workouts/${workout.uuid}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
                <Link to="/plans">
                  <Button className="w-full mt-2" variant="outline">
                    Create a Workout Plan
                  </Button>
                </Link>
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

      {/* Workout Calendar Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Workout Activity
          </CardTitle>
          <CardDescription>Your workout consistency over time</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <WorkoutCalendarHeatmap workoutRecords={workoutRecords} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
