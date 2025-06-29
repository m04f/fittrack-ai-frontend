
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dumbbell,
  Search,
  Plus,
  Filter,
  ArrowRight,
  Clock,
  History,
} from "lucide-react";
import api from "@/services/api";
import { Workout } from "@/types/api";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const WorkoutsPage = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkouts = async () => {
      setLoading(true);
      try {
        const data = await api.getWorkouts();
        const workoutsList = Array.isArray(data) ? data : [];
        setWorkouts(workoutsList);
        setFilteredWorkouts(workoutsList);
      } catch (error) {
        console.error("Error fetching workouts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = workouts.filter(
        (workout) =>
          workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          workout.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredWorkouts(filtered);
    } else {
      setFilteredWorkouts(workouts);
    }
  }, [searchTerm, workouts]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const renderWorkoutCard = (workout: Workout) => {
    return (
      <Card key={workout.uuid} className="fitness-card border-2 border-fitness-200/50 shadow-lg hover:border-fitness-500/50 transition-all duration-200 h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl text-fitness-700 dark:text-fitness-400">{workout.name}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {workout.description || "No description available"}
              </CardDescription>
            </div>
            <Badge
              variant={workout.public ? "default" : "outline"}
              className={workout.public ? "bg-gradient-to-r from-fitness-600 to-fitness-700 hover:from-fitness-700 hover:to-fitness-800 text-white" : "border-fitness-200/50"}
            >
              {workout.public ? "Public" : "Private"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex items-center mb-4 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-2 text-fitness-600" />
            <span>
              {(() => {
                const totalSeconds = workout.total_duration;
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                return `${minutes} min${seconds > 0 ? ` ${seconds} sec` : ""}`;
              })()}
            </span>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Dumbbell className="w-4 h-4 mr-2 text-fitness-600" />
            <span>{workout.exercise_names?.length || 0} exercises</span>
          </div>
          <div className="flex-1">
            <div className="mb-4">
              <h4 className="font-medium mb-2">Exercises:</h4>
              <ul className="text-sm text-muted-foreground">
                {workout.exercise_names.slice(0, 3).map((name, index) => (
                  <li key={index} className="mb-1">
                    {name}
                  </li>
                ))}
                {workout.exercise_names.length > 3 && (
                  <li className="italic">
                    +{workout.exercise_names.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="flex justify-between mt-auto items-center">
            <span className="text-xs text-muted-foreground">
              Created by: {workout.creator || "Unknown Creator"}
            </span>
            <Button asChild size="sm" variant="outline" className="border-2 border-fitness-600 text-fitness-600 hover:bg-fitness-600 hover:text-white transition-all duration-200">
              <Link to={`/workouts/${workout.uuid}`}>
                View <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSkeletonCard = (index: number) => (
    <Card key={index} className="fitness-card border-2 border-fitness-200/50 shadow-lg h-full">
      <CardHeader>
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[250px]" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
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
  );

  return (
    <div className="animate-enter space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-fitness-600 to-fitness-700 bg-clip-text text-transparent">Workout Library</h1>
        <p className="text-muted-foreground">
          Browse and manage your workout routines
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workouts..."
            className="pl-9"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="border-2 border-fitness-200/50 hover:border-fitness-500/50 hover:bg-fitness-50/50 dark:hover:bg-fitness-900/20 transition-all duration-200">
            <Link to="/history">
              <History className="mr-2 h-4 w-4" />
              History
            </Link>
          </Button>
          <Button variant="outline" className="border-2 border-fitness-200/50 hover:border-fitness-500/50 hover:bg-fitness-50/50 dark:hover:bg-fitness-900/20 transition-all duration-200">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="fitness" asChild>
            <Link to="/workouts/create">
              <Plus className="mr-2 h-4 w-4" />
              New Workout
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => renderSkeletonCard(i))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkouts.length > 0 ? (
              filteredWorkouts.map(renderWorkoutCard)
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-fitness-500 to-fitness-600 flex items-center justify-center mb-4 shadow-lg">
                  <Dumbbell className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-medium">No workouts found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm
                    ? "Try a different search term"
                    : "Create your first workout to get started"}
                </p>
                <Button className="mt-4" variant="fitness" asChild>
                  <Link to="/workouts/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Workout
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WorkoutsPage;
