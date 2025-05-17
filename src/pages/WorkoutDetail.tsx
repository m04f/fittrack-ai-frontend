import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Clock,
  Dumbbell,
  Play,
  Edit,
  Share,
  Weight,
} from "lucide-react";
import api from "@/services/api";
import { Workout, WorkoutExercise, WorkoutRecord } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const WorkoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [searchParams] = useSearchParams();
  const planworkout = searchParams.get("planworkout");
  const plan = searchParams.get("plan");
  const [loading, setLoading] = useState(true);
  const [startingWorkout, setStartingWorkout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const data = await api.getWorkout(id);
        setWorkout(data);
      } catch (error) {
        console.error("Error fetching workout:", error);
        toast.error("Failed to load workout details");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [id]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${seconds} sec`;
    }

    return `${minutes} min${remainingSeconds > 0 ? ` ${remainingSeconds} sec` : ""}`;
  };

  const handleStartWorkout = async () => {
    if (!workout) return;

    setStartingWorkout(true);
    try {
      const workoutRecord = await api.createWorkoutRecord({
        workout: workout.uuid,
      });

      if (plan && planworkout) {
        await api.setPlanWorkoutRecord({
          record: workoutRecord.uuid,
          plan: plan,
          workout: planworkout,
        });
      }

      toast.success("Workout started successfully!");

      // Redirect to the workout record detail page
      navigate(`/workout-record/${workoutRecord.uuid}`);
    } catch (error) {
      console.error("Error starting workout:", error);
      toast.error("Failed to start workout");
    } finally {
      setStartingWorkout(false);
    }
  };

  const totalDuration = workout ? workout.total_duration : 0;

  return (
    <div className="animate-enter space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link to="/workouts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {loading ? <Skeleton className="h-9 w-40" /> : workout?.name}
        </h1>
        {loading ? (
          <Skeleton className="h-6 w-20 ml-auto" />
        ) : (
          <Badge
            variant={workout?.public ? "default" : "outline"}
            className={`${workout?.public ? "bg-fitness-500" : ""} ml-auto`}
          >
            {workout?.public ? "Public" : "Private"}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />

          <div className="flex gap-4 my-6">
            <Skeleton className="h-16 w-32" />
            <Skeleton className="h-16 w-32" />
          </div>

          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          <div>
            <p className="text-muted-foreground">
              {workout?.description || "No description provided"}
            </p>
            <div className="flex flex-wrap gap-6 mt-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-fitness-600" />
                <span>
                  <span className="font-medium">
                    {formatTime(totalDuration)}
                  </span>{" "}
                  <span className="text-muted-foreground">total time</span>
                </span>
              </div>
              <div className="flex items-center">
                <Dumbbell className="h-5 w-5 mr-2 text-fitness-600" />
                <span>
                  <span className="font-medium">
                    {workout?.exercises.length}
                  </span>{" "}
                  <span className="text-muted-foreground">exercises</span>
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">
                  Created by: {workout?.creator}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-fitness-600 hover:bg-fitness-700"
              onClick={handleStartWorkout}
              disabled={startingWorkout}
            >
              <Play className="mr-2 h-4 w-4" />
              {startingWorkout ? "Starting..." : "Start Workout"}
            </Button>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" /> Edit Workout
            </Button>
            <Button variant="outline">
              <Share className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>

          <Tabs defaultValue="exercises" className="w-full">
            <TabsList>
              <TabsTrigger value="exercises">Exercises</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="exercises">
              <Card>
                <CardHeader>
                  <CardTitle>Exercises</CardTitle>
                  <CardDescription>
                    Complete list of exercises in this workout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Exercise</TableHead>
                        <TableHead>Sets</TableHead>
                        <TableHead>Reps / Time</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Rest</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workout?.exercises?.map((exercise, index) => (
                        <TableRow key={exercise.uuid}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {exercise.exercise}
                          </TableCell>
                          <TableCell>{exercise.sets}x</TableCell>
                          <TableCell>
                            {exercise.reps
                              ? `${exercise.reps} reps`
                              : exercise.duration
                                ? `${exercise.duration} sec`
                                : "—"}
                          </TableCell>
                          <TableCell>
                            {exercise.weight ? `${exercise.weight} kg` : "—"}
                          </TableCell>
                          <TableCell>{exercise.rest} sec</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="records">
              <Card>
                <CardHeader>
                  <CardTitle>Past Records</CardTitle>
                  <CardDescription>
                    Your previous performance with this workout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Weight className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No records yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete this workout to track your progress
                    </p>
                    <Button className="mt-4 bg-fitness-600 hover:bg-fitness-700">
                      <Play className="mr-2 h-4 w-4" /> Start Workout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>
                    Additional information about this workout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {workout?.notes || "No additional notes for this workout."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default WorkoutDetail;
