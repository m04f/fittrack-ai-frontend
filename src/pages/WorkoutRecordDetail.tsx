
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Clock, Dumbbell, Check, Plus, Weight } from "lucide-react";
import api from "@/services/api";
import { Workout, WorkoutExercise, WorkoutRecord, ExerciseRecord } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const WorkoutRecordDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [workoutRecord, setWorkoutRecord] = useState<WorkoutRecord | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch workout record data
        const recordData = await api.getUserWorkoutRecord(id);
        setWorkoutRecord(recordData);
        
        // Fetch the related workout data
        const workoutData = await api.getWorkout(recordData.workout);
        setWorkout(workoutData);
        
        // Initialize exercise records based on workout exercises
        if (workoutData.exercises && workoutData.exercises.length > 0) {
          const initialExercises = workoutData.exercises.map(ex => ({
            uuid: "",  // Will be set when saved
            exercise: ex.exercise,
            reps: ex.reps || null,
            weight: ex.weight || null,
            duration: ex.duration || null,
            rest: ex.rest || null,
            pre: null,
            datetime: new Date().toISOString(),
            workout_record: id
          }));
          
          setExerciseRecords(initialExercises);
        }
      } catch (error) {
        console.error("Error fetching workout record data:", error);
        toast.error("Failed to load workout record");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleExerciseChange = (index: number, field: keyof ExerciseRecord, value: any) => {
    const updatedExercises = [...exerciseRecords];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value
    };
    setExerciseRecords(updatedExercises);
  };

  const handleAddExercise = async (index: number) => {
    const exerciseToAdd = exerciseRecords[index];
    
    if (!exerciseToAdd || !workoutRecord) return;
    
    try {
      setSaving(true);
      
      const exerciseData = {
        workout_record: workoutRecord.uuid,
        exercise: exerciseToAdd.exercise,
        reps: exerciseToAdd.reps,
        weight: exerciseToAdd.weight,
        pre: exerciseToAdd.pre,
        rest: exerciseToAdd.rest,
        duration: exerciseToAdd.duration
      };
      
      await api.createExerciseRecord(exerciseData);
      
      // Update UI to show this exercise was added
      const updatedExercises = [...exerciseRecords];
      updatedExercises[index] = {
        ...updatedExercises[index],
        saved: true
      };
      setExerciseRecords(updatedExercises);
      
      toast.success(`${exerciseToAdd.exercise} added to your workout`);
    } catch (error) {
      console.error("Error adding exercise:", error);
      toast.error("Failed to add exercise");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteWorkout = () => {
    toast.success("Workout completed!");
    navigate("/workouts");
  };

  if (loading) {
    return (
      <div className="animate-enter space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-enter space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link to="/workouts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Recording: {workout?.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exercise Progress</CardTitle>
          <CardDescription>Record your sets for each exercise</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exercise</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>Weight (kg)</TableHead>
                <TableHead>Duration (sec)</TableHead>
                <TableHead>Rest (sec)</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exerciseRecords.map((exercise, index) => (
                <TableRow key={`${exercise.exercise}-${index}`}>
                  <TableCell className="font-medium">{exercise.exercise}</TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      min="0"
                      className="w-20"
                      value={exercise.reps || ""}
                      onChange={(e) => handleExerciseChange(
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
                      onChange={(e) => handleExerciseChange(
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
                      onChange={(e) => handleExerciseChange(
                        index, 
                        'duration', 
                        e.target.value ? parseInt(e.target.value) : null
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      min="0"
                      className="w-20"
                      value={exercise.rest || ""}
                      onChange={(e) => handleExerciseChange(
                        index, 
                        'rest', 
                        e.target.value ? parseInt(e.target.value) : null
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleAddExercise(index)}
                      disabled={saving || exercise.saved}
                      variant={exercise.saved ? "outline" : "default"}
                      className={exercise.saved ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-fitness-600 hover:bg-fitness-700"}
                    >
                      {exercise.saved ? (
                        <>
                          <Check className="mr-1 h-4 w-4" /> Added
                        </>
                      ) : (
                        <>
                          <Plus className="mr-1 h-4 w-4" /> Add Set
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link to="/workouts">Cancel</Link>
          </Button>
          <Button 
            className="bg-fitness-600 hover:bg-fitness-700"
            onClick={handleCompleteWorkout}
          >
            <Check className="mr-2 h-4 w-4" /> Complete Workout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WorkoutRecordDetail;
