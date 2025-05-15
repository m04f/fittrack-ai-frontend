import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Search, FileText, ArrowRight } from "lucide-react";
import api from "@/services/api";
import { Plan } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const PlansPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const data = await api.getPlans();
        const plansList = data || [];
        setPlans(plansList);
        setFilteredPlans(plansList);
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = plans.filter(
        (plan) =>
          plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredPlans(filtered);
    } else {
      setFilteredPlans(plans);
    }
  }, [searchTerm, plans]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="animate-enter space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training Plans</h1>
        <p className="text-muted-foreground">
          Browse and follow structured workout plans
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
        <Button className="bg-fitness-600 hover:bg-fitness-700">
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
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
              {filteredPlans.map((plan) => (
                <Card key={plan.uuid} className="flex flex-col h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <Badge
                        variant={plan.public ? "default" : "outline"}
                        className={plan.public ? "bg-fitness-500" : ""}
                      >
                        {plan.public ? "Public" : "Private"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {plan.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {plan.workouts.length} workouts •{" "}
                          {plan.workouts.length} days
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-medium mb-1 text-sm">Schedule:</h4>
                        <ul className="text-sm text-muted-foreground">
                          {plan.workouts.slice(0, 3).map((planWorkout) => (
                            <li
                              key={planWorkout.uuid}
                              className="flex justify-between"
                            >
                              <span>Day {planWorkout.day}</span>
                              <span className="truncate max-w-[70%] text-right">
                                {planWorkout.name}
                              </span>
                            </li>
                          ))}
                          {plan.workouts.length > 3 && (
                            <li className="text-xs italic">
                              +{plan.workouts.length - 3} more days
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="flex justify-between mt-auto items-center">
                      <span className="text-xs text-muted-foreground">
                        Creator: {plan.creator}
                      </span>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/plans/${plan.uuid}`}>
                          View <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No plans found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm
                  ? "Try a different search term"
                  : "Create your first training plan to get started"}
              </p>
              <Button className="mt-4 bg-fitness-600 hover:bg-fitness-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Training Plan
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlansPage;
