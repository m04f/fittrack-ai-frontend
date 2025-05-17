
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, CalendarCheck, CalendarPlus } from "lucide-react";
import api from "@/services/api";
import { UserPlan, Plan } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isSameDay } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
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
        const currentPlan = userPlanData.find(p => p.uuid === planId);
        
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

  // Process workout dates for calendar
  const workoutDates = userPlan?.workouts?.map(w => ({
    date: parseISO(w.date),
    uuid: w.uuid,
    workoutId: w.workout,
    completed: w.record !== null,
  })) || [];

  // Count completed workouts for progress
  const completedCount = userPlan?.workouts?.filter(w => w.record !== null).length || 0;
  const totalWorkouts = userPlan?.workouts?.length || 0;
  const progressPercentage = totalWorkouts > 0 ? (completedCount / totalWorkouts) * 100 : 0;

  const handleDateClick = (date: Date) => {
    const selectedWorkout = workoutDates.find(w => isSameDay(w.date, date));
    
    if (selectedWorkout) {
      // Navigate to the workout details with the planday parameter
      navigate(`/workouts/${selectedWorkout.workoutId}?planday=${selectedWorkout.uuid}`);
    }
  };

  // Customize day rendering in the calendar
  const renderDay = (date: Date) => {
    const workout = workoutDates.find(w => isSameDay(w.date, date));
    
    if (!workout) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`h-full w-full flex items-center justify-center rounded-full ${
                workout.completed 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {date.getDate()}
              {workout.completed && (
                <CalendarCheck className="h-3 w-3 ml-0.5 text-green-600" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{workout.completed ? "Completed workout" : "Scheduled workout"}</p>
            <p>Click to view details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

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
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{planDetails.description}</p>
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">
                Progress: {completedCount} of {totalWorkouts} workouts completed
              </span>
            </div>
            <span className="text-sm font-medium">{progressPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2 mb-6" />

          <div className="flex justify-center p-2 bg-card rounded-lg shadow-sm">
            <Calendar 
              mode="multiple"
              selected={workoutDates.map(w => w.date)}
              onDayClick={handleDateClick}
              classNames={{
                day_today: "bg-muted text-foreground", 
              }}
              components={{
                Day: ({ date, ...props }) => {
                  const content = renderDay(date);
                  return content ? (
                    <div {...props} className="h-9 w-9 p-0 cursor-pointer">
                      {content}
                    </div>
                  ) : (
                    <div {...props}>{date.getDate()}</div>
                  );
                },
              }}
              className="p-3 pointer-events-auto"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6">
            <div className="flex items-center p-2 rounded-md bg-blue-50">
              <CalendarPlus className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-sm">Scheduled workout</span>
            </div>
            <div className="flex items-center p-2 rounded-md bg-green-50">
              <CalendarCheck className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-sm">Completed workout</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            Click on a workout date in the calendar to view details or start the workout.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanDetails;
