
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Plus, 
  Search, 
  FileText, 
  ArrowRight,
  CalendarCheck 
} from "lucide-react";
import api from "@/services/api";
import { Plan, UserPlan } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

const PlansPage = () => {
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<UserPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        // Fetch user's active plans
        const userPlansData = await api.getUserPlans();
        setUserPlans(userPlansData);
        setFilteredPlans(userPlansData);

        // Also fetch all available plans for enrollment dialog
        const availablePlansData = await api.getPlans();
        setAvailablePlans(availablePlansData || []);
      } catch (error) {
        console.error("Error fetching plans:", error);
        toast.error("Failed to load plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    if (searchTerm && userPlans.length > 0) {
      // Note: This is a simple search that just checks plan IDs
      // We would need to fetch plan details to search by name
      const filtered = userPlans.filter(
        (userPlan) => userPlan.plan.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlans(filtered);
    } else {
      setFilteredPlans(userPlans);
    }
  }, [searchTerm, userPlans]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEnrollInPlan = async (planUuid: string) => {
    setEnrollLoading(true);
    try {
      const newUserPlan = await api.enrollInPlan(planUuid);
      setUserPlans([...userPlans, newUserPlan]);
      setFilteredPlans([...userPlans, newUserPlan]);
      toast.success("Successfully enrolled in plan");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error enrolling in plan:", error);
      toast.error("Failed to enroll in plan");
    } finally {
      setEnrollLoading(false);
    }
  };

  // Helper function to find next upcoming workout
  const getNextWorkout = (plan: UserPlan) => {
    const today = new Date().toISOString().split('T')[0];
    const upcomingWorkouts = plan.workouts
      .filter(w => w.date >= today && w.record === null)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return upcomingWorkouts.length > 0 ? upcomingWorkouts[0] : null;
  };

  // Helper function to count completed workouts
  const getCompletedWorkoutsCount = (plan: UserPlan) => {
    return plan.workouts.filter(w => w.record !== null).length;
  };

  return (
    <div className="animate-enter space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Active Plans</h1>
        <p className="text-muted-foreground">
          Track your ongoing training plans and progress
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plans..."
            className="pl-9"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-fitness-600 hover:bg-fitness-700">
              <Plus className="mr-2 h-4 w-4" />
              Enroll in Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enroll in a Training Plan</DialogTitle>
              <DialogDescription>
                Select a plan to add to your active plans
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {availablePlans.length > 0 ? (
                availablePlans.map((plan) => (
                  <Card key={plan.uuid} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Badge
                          variant={plan.public ? "default" : "outline"}
                          className={plan.public ? "bg-fitness-500" : ""}
                        >
                          {plan.public ? "Public" : "Private"}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-1">
                        {plan.description || "No description available"}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2 flex justify-between">
                      <span className="text-xs text-muted-foreground">
                        {plan.workouts.length} workouts
                      </span>
                      <Button 
                        onClick={() => handleEnrollInPlan(plan.uuid)}
                        disabled={enrollLoading}
                        size="sm"
                      >
                        Enroll
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center py-4">No available plans to enroll in</div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-[150px]" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-[250px] mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="pt-4 flex justify-between">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-8 w-[80px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((userPlan) => {
                const nextWorkout = getNextWorkout(userPlan);
                const completedWorkouts = getCompletedWorkoutsCount(userPlan);
                const totalWorkouts = userPlan.workouts.length;
                
                return (
                  <Card key={userPlan.uuid} className="flex flex-col h-full">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        Training Plan (Started {format(new Date(userPlan.start_date), 'PP')})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {totalWorkouts} workouts • {completedWorkouts} completed
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-3">
                          <div 
                            className="bg-fitness-500 h-2.5 rounded-full" 
                            style={{ width: `${(completedWorkouts / totalWorkouts) * 100}%` }}
                          ></div>
                        </div>

                        <div className="space-y-2 mt-4">
                          <h4 className="font-medium mb-1 text-sm">Next workout:</h4>
                          {nextWorkout ? (
                            <div className="flex justify-between text-sm p-2 bg-muted rounded-md">
                              <span>{format(new Date(nextWorkout.date), 'PP')}</span>
                              <span>Workout ID: {nextWorkout.workout.substring(0, 6)}...</span>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No upcoming workouts</p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between mt-auto items-center">
                        <div className="flex items-center">
                          <CalendarCheck className="h-4 w-4 mr-2 text-fitness-500" />
                          <span className="text-sm">{completedWorkouts}/{totalWorkouts}</span>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/plans/${userPlan.uuid}`}>
                            View Calendar <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No active plans</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm
                  ? "Try a different search term"
                  : "Enroll in a training plan to get started"}
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4 bg-fitness-600 hover:bg-fitness-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Enroll in Training Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Enroll in a Training Plan</DialogTitle>
                    <DialogDescription>
                      Select a plan to add to your active plans
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {availablePlans.length > 0 ? (
                      availablePlans.map((plan) => (
                        <Card key={plan.uuid} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                              <Badge
                                variant={plan.public ? "default" : "outline"}
                                className={plan.public ? "bg-fitness-500" : ""}
                              >
                                {plan.public ? "Public" : "Private"}
                              </Badge>
                            </div>
                            <CardDescription className="line-clamp-1">
                              {plan.description || "No description available"}
                            </CardDescription>
                          </CardHeader>
                          <CardFooter className="pt-2 flex justify-between">
                            <span className="text-xs text-muted-foreground">
                              {plan.workouts.length} workouts
                            </span>
                            <Button 
                              onClick={() => handleEnrollInPlan(plan.uuid)}
                              disabled={enrollLoading}
                              size="sm"
                            >
                              Enroll
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-4">No available plans to enroll in</div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlansPage;
