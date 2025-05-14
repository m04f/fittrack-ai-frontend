
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dumbbell, Search, Check, Timer, Weight } from "lucide-react";
import api from "@/services/api";
import { Workout, WorkoutExercise } from "@/types/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkoutRecord {
  workout: string;
  exercises: ExerciseRecord[];
}

interface ExerciseRecord {
  exercise: string;
  reps?: number | null;
  weight?: number | null;
  duration?: number | null;
  rest?: number | null;
}

const RecordWorkoutPage = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [workoutRecord, setWorkoutRecord] = useState<WorkoutRecord>({
    workout: "",
    exercises: [],
  });

  useEffect(() => {
    const fetchWorkouts = async () => {
      setLoading(true);
      try {
        const data = await api.getWorkouts();
        setWorkouts(data.results || []);
      } catch (error) {
        console.error("Error fetching workouts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  const handleSelectWorkout = async (uuid: string) => {
    try {
      const workout = await api.getWorkout(uuid);
      setSelectedWorkout(workout);
      
      // Initialize workout record
      setWorkoutRecord({
        workout: `/api/workouts/${uuid}/`,
        exercises: workout.exercises.map(ex => ({
          exercise: ex.exercise,
          reps: ex.reps || null,
          weight: ex.weight || null,
          duration: ex.duration || null,
          rest: ex.rest || null
        }))
      });
    } catch (error) {
      console.error("Error fetching workout details:", error);
    }
  };

  const handleExerciseValueChange = (index: number, field: keyof ExerciseRecord, value: number | null) => {
    const updatedExercises = [...workoutRecord.exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value
    };
    
    setWorkoutRecord({
      ...workoutRecord,
      exercises: updatedExercises
    });
  };

  const handleSubmitRecord = async () => {
    setRecording(true);
    try {
      await api.createWorkoutRecord(workoutRecord);
      toast.success("Workout recorded successfully!");
      setSelectedWorkout(null);
      setWorkoutRecord({
        workout: "",
        exercises: []
      });
    } catch (error) {
      console.error("Error recording workout:", error);
      toast.error("Failed to record workout");
    } finally {
      setRecording(false);
    }
  };

  const renderWorkoutSelection = () => (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search workouts..." className="pl-9" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="cursor-pointer hover:shadow transition-shadow">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-4 mt-4">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          workouts.map((workout) => (
            <Card 
              key={workout.uuid} 
              className={`cursor-pointer hover:shadow transition-shadow ${selectedWorkout?.uuid === workout.uuid ? 'border-fitness-500 border-2' : ''}`}
              onClick={() => handleSelectWorkout(workout.uuid)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  {workout.name}
                  {selectedWorkout?.uuid === workout.uuid && (
                    <Check className="h-5 w-5 text-fitness-600" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-1 text-muted-foreground">{workout.description || "No description"}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <div className="flex items-center">
                    <Dumbbell className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>{workout.exercises.length}</span>
                  </div>
                  <div className="flex items-center">
                    <Timer className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>
                      {workout.exercises.reduce((acc, ex) => {
                        const duration = ex.duration || 0;
                        const restTime = ex.rest * (ex.sets - 1);
                        return acc + duration * ex.sets + restTime;
                      }, 0)}s
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        
        {!loading && workouts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No workouts available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create a workout first to record your progress
            </p>
            <Button className="mt-4 bg-fitness-600 hover:bg-fitness-700" onClick={() => {}}>
              Create Workout
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderRecordForm = () => (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => setSelectedWorkout(null)}>
        Choose a different workout
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>{selectedWorkout?.name}</CardTitle>
          <CardDescription>
            Record your performance for each exercise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exercise</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>Weight (kg)</TableHead>
                <TableHead>Duration (sec)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workoutRecord.exercises.map((exercise, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{exercise.exercise}</TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      min="0"
                      className="w-20" 
                      value={exercise.reps || ""}
                      onChange={(e) => handleExerciseValueChange(
                        index, 
                        'reps', 
                        e.target.value ? parseInt(e.target.value) : null
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      min="0"
                      step="0.5"
                      className="w-20" 
                      value={exercise.weight || ""}
                      onChange={(e) => handleExerciseValueChange(
                        index, 
                        'weight', 
                        e.target.value ? parseFloat(e.target.value) : null
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      min="0"
                      className="w-20" 
                      value={exercise.duration || ""}
                      onChange={(e) => handleExerciseValueChange(
                        index, 
                        'duration', 
                        e.target.value ? parseInt(e.target.value) : null
                      )}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex justify-end mt-6">
            <Button 
              className="bg-fitness-600 hover:bg-fitness-700"
              onClick={handleSubmitRecord}
              disabled={recording}
            >
              {recording ? "Saving..." : "Save Workout Record"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="animate-enter space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Workout</h1>
        <p className="text-muted-foreground">Track your exercise performance</p>
      </div>
      
      <Tabs defaultValue="record" className="w-full">
        <TabsList>
          <TabsTrigger value="record">Record Workout</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="record">
          {selectedWorkout ? renderRecordForm() : renderWorkoutSelection()}
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Workout History</CardTitle>
              <CardDescription>
                Your recent workout records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Weight className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Coming Soon</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your workout history will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecordWorkoutPage;
