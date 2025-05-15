import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import api from "@/services/api";
import { Plan } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";

const PlanDetails = () => {
  const { planId } = useParams();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      setLoading(true);
      try {
        const data = await api.getPlan(planId);
        setPlan(data);
      } catch (error) {
        console.error("Error fetching plan details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (planId) {
      fetchPlanDetails();
    }
  }, [planId]);

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

  if (!plan) {
    return <p className="text-center text-muted-foreground">Plan not found</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <Badge
              variant={plan.public ? "default" : "outline"}
              className={plan.public ? "bg-fitness-500" : ""}
            >
              {plan.public ? "Public" : "Private"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{plan.description}</p>
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">
                {plan.workouts.length} workouts • {plan.workouts.length} days
              </span>
            </div>
            <div className="grid grid-cols-7 gap-4">
              {plan.workouts.map((workoutInfo) => (
                <div
                  key={workoutInfo.uuid}
                  className="p-2 border rounded-md text-center cursor-pointer hover:bg-fitness-100"
                  onClick={() =>
                    (window.location.href = `/workouts/${workoutInfo.workout_uuid}`)
                  }
                >
                  <span className="block font-medium">
                    Day {workoutInfo.day}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {workoutInfo.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanDetails;
