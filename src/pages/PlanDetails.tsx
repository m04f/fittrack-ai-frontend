import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  CheckCircle2,
  Clock,
  ArrowRight,
  CalendarDaysIcon,
  ChevronRight,
} from "lucide-react";
import api from "@/services/api";
import { UserPlan, Plan } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  format,
  parseISO,
  isToday,
  isBefore,
  isAfter,
  addDays,
} from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PlanDetails = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [planDetails, setPlanDetails] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      setLoading(true);
      try {
        // Fetch the user's plan
        const userPlanData = await api.getUserPlans();
        const currentPlan = userPlanData.find((p) => p.uuid === planId);

        if (!currentPlan) {
          toast.error("Plan not found");
          return;
        }

        setUserPlan(currentPlan);

        // Also fetch the plan details to get the name and description
        const planData = await api.getPlan(currentPlan.plan);
        setPlanDetails(planData);
      } catch (error) {
        console.error("Error fetching plan details:", error);
        toast.error("Failed to load plan details");
      } finally {
        setLoading(false);
      }
    };

    if (planId) {
      fetchPlanDetails();
    }
  }, [planId]);

  // Count completed workouts for progress
  const completedCount =
    userPlan?.workouts?.filter((w) => w.record !== null).length || 0;
  const totalWorkouts = userPlan?.workouts?.length || 0;
  const progressPercentage =
    totalWorkouts > 0 ? (completedCount / totalWorkouts) * 100 : 0;

  // Group workouts by week
  const groupWorkoutsByWeek = () => {
    if (!userPlan?.workouts) return [];

    const sortedWorkouts = [...userPlan.workouts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const weeks: Array<{
      weekStart: Date;
      workouts: typeof sortedWorkouts;
      isCurrentWeek: boolean;
    }> = [];

    let currentWeekStart: Date | null = null;
    let currentWeekWorkouts: typeof sortedWorkouts = [];

    sortedWorkouts.forEach((workout) => {
      const workoutDate = parseISO(workout.date);

      if (!currentWeekStart) {
        // First workout defines the first week
        currentWeekStart = new Date(workoutDate);
        currentWeekStart.setDate(
          currentWeekStart.getDate() - currentWeekStart.getDay(),
        );
        currentWeekWorkouts.push(workout);
      } else {
        // Check if this workout is in the same week
        const nextWeekStart = new Date(currentWeekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);

        if (workoutDate < nextWeekStart) {
          // Same week
          currentWeekWorkouts.push(workout);
        } else {
          // New week
          weeks.push({
            weekStart: new Date(currentWeekStart),
            workouts: [...currentWeekWorkouts],
            isCurrentWeek: isCurrentWeek(currentWeekStart),
          });

          // Reset for new week
          currentWeekStart = new Date(workoutDate);
          currentWeekStart.setDate(
            currentWeekStart.getDate() - currentWeekStart.getDay(),
          );
          currentWeekWorkouts = [workout];
        }
      }
    });

    // Add the last week
    if (currentWeekStart && currentWeekWorkouts.length > 0) {
      weeks.push({
        weekStart: new Date(currentWeekStart),
        workouts: [...currentWeekWorkouts],
        isCurrentWeek: isCurrentWeek(currentWeekStart),
      });
    }

    return weeks;
  };

  const isCurrentWeek = (weekStart: Date) => {
    const today = new Date();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return today >= weekStart && today <= weekEnd;
  };

  const handleWorkoutClick = (
    workoutUuid: string,
    workoutId: string,
    planUuid: string,
  ) => {
    navigate(
      `/workouts/${workoutId}?planworkout=${workoutUuid}&plan=${planUuid}`,
    );
  };

  const getWorkoutStatusClass = (date: string, hasRecord: boolean) => {
    const workoutDate = parseISO(date);
    const today = new Date();

    if (hasRecord) {
      return "bg-green-50 hover:bg-green-100 border-green-200";
    } else if (isToday(workoutDate)) {
      return "bg-blue-50 hover:bg-blue-100 border-blue-200";
    } else if (isBefore(workoutDate, today)) {
      return "bg-amber-50 hover:bg-amber-100 border-amber-200";
    } else {
      return "bg-gray-50 hover:bg-gray-100 border-gray-200";
    }
  };

  const getWorkoutStatusText = (date: string, hasRecord: boolean) => {
    const workoutDate = parseISO(date);
    const today = new Date();

    if (hasRecord) {
      return "Completed";
    } else if (isToday(workoutDate)) {
      return "Today";
    } else if (isBefore(workoutDate, today)) {
      return "Missed";
    } else {
      return "Upcoming";
    }
  };

  const weeks = groupWorkoutsByWeek();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!userPlan || !planDetails) {
    return <p className="text-center text-muted-foreground">Plan not found</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{planDetails.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Started on {format(new Date(userPlan.start_date), "PPP")}
              </p>
            </div>
            <Badge
              variant={planDetails.public ? "default" : "outline"}
              className={planDetails.public ? "bg-fitness-500" : ""}
            >
              {planDetails.public ? "Public" : "Private"}
            </Badge>
          </div>
          <div className="flex flex-row gap-4 mb-6">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={async () => {
                try {
                  await api.unenrollFromPlan(planId);
                  toast.success("Successfully unenrolled from the plan");
                  navigate("/plans");
                } catch (error) {
                  console.error("Error unenrolling from plan:", error);
                  toast.error("Failed to unenroll from the plan");
                }
              }}
            >
              Unenroll from Plan
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/plans")}
            >
              Back to Plans
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {planDetails.description}
          </p>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">
                Progress: {completedCount} of {totalWorkouts} workouts completed
              </span>
            </div>
            <span className="text-sm font-medium">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2 mb-6" />

          {/* Workout Schedule */}
          <div className="space-y-6">
            {weeks.map((week, weekIndex) => (
              <Card
                key={week.weekStart.toISOString()}
                className={`overflow-hidden ${week.isCurrentWeek ? "border-blue-300 shadow-sm" : ""}`}
              >
                <CardHeader className="py-2 px-4 bg-muted/40">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <h3 className="text-sm font-medium">
                        Week {weekIndex + 1}: {format(week.weekStart, "MMM d")}{" "}
                        - {format(addDays(week.weekStart, 6), "MMM d")}
                      </h3>
                    </div>
                    {week.isCurrentWeek && (
                      <Badge variant="secondary" className="text-xs">
                        Current Week
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead>Workout</TableHead>
                        <TableHead className="w-[100px] text-right">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {week.workouts.map((workout) => (
                        <TableRow
                          key={workout.uuid}
                          className={`cursor-pointer ${getWorkoutStatusClass(workout.date, workout.record !== null)}`}
                          onClick={() =>
                            handleWorkoutClick(
                              workout.uuid,
                              workout.workout,
                              planId,
                            )
                          }
                        >
                          <TableCell className="font-medium">
                            {format(parseISO(workout.date), "EEE, MMM d")}
                          </TableCell>
                          <TableCell>Workout Plan</TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-end">
                                    {workout.record !== null ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                                    ) : isToday(parseISO(workout.date)) ? (
                                      <Clock className="h-4 w-4 text-blue-500 mr-1" />
                                    ) : isBefore(
                                        parseISO(workout.date),
                                        new Date(),
                                      ) ? (
                                      <Clock className="h-4 w-4 text-amber-500 mr-1" />
                                    ) : (
                                      <ArrowRight className="h-4 w-4 text-gray-500 mr-1" />
                                    )}
                                    <span
                                      className={`text-sm ${workout.record ? "text-green-700" : ""}`}
                                    >
                                      {getWorkoutStatusText(
                                        workout.date,
                                        workout.record !== null,
                                      )}
                                    </span>
                                    <ChevronRight className="h-4 w-4 ml-1 text-muted-foreground" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {workout.record !== null
                                      ? "Workout completed"
                                      : "Click to start workout"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-6">
            <div className="flex items-center p-2 rounded-md bg-gray-50">
              <ArrowRight className="h-4 w-4 mr-2 text-gray-600" />
              <span className="text-sm">Upcoming workout</span>
            </div>
            <div className="flex items-center p-2 rounded-md bg-blue-50">
              <Clock className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-sm">Today's workout</span>
            </div>
            <div className="flex items-center p-2 rounded-md bg-amber-50">
              <Clock className="h-4 w-4 mr-2 text-amber-600" />
              <span className="text-sm">Missed workout</span>
            </div>
            <div className="flex items-center p-2 rounded-md bg-green-50">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-sm">Completed workout</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-6">
            <Button
              variant="destructive"
              className="w-full"
              onClick={async () => {
                try {
                  await api.unenrollFromPlan(planId);
                  toast.success("Successfully unenrolled from the plan");
                  navigate("/plans");
                } catch (error) {
                  console.error("Error unenrolling from plan:", error);
                  toast.error("Failed to unenroll from the plan");
                }
              }}
            >
              Unenroll from Plan
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/plans")}
            >
              Back to Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanDetails;
