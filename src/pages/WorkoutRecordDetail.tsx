
import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Clock, Dumbbell, Check, Plus, Weight, Timer, Repeat } from "lucide-react";
import api from "@/services/api";
import { Workout, WorkoutExercise, WorkoutRecord, ExerciseRecord } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const WorkoutRecordDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [workoutRecord, setWorkoutRecord] = useState<WorkoutRecord | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [completedSets, setCompletedSets] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  
  // Rest timer state
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null);
  const timerInterval = useRef<number | null>(null);

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

        // Get already completed sets from the record
        if (recordData.exercises && recordData.exercises.length > 0) {
          setCompletedSets(recordData.exercises);
        }
        
        // Initialize exercise records based on workout exercises
        if (workoutData.exercises && workoutData.exercises.length > 0) {
          const initialExercises = workoutData.exercises.map(ex => ({
            uuid: "",
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

  // Rest timer effect
  useEffect(() => {
    if (restTimerActive && restTimeRemaining > 0) {
      timerInterval.current = window.setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval.current as number);
            setRestTimerActive(false);
            toast.success("Rest time completed!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [restTimerActive, restTimeRemaining]);

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
      
      const response = await api.createExerciseRecord(exerciseData);
      
      // Add the new set to completed sets
      setCompletedSets(prev => [...prev, { ...response, saved: true }]);
      
      toast.success(`${exerciseToAdd.exercise} set added successfully`);
      
      // Start rest timer if rest is specified
      if (exerciseToAdd.rest && exerciseToAdd.rest > 0) {
        setRestTimeRemaining(exerciseToAdd.rest);
        setRestTimerActive(true);
        setActiveExerciseIndex(index);
      }
    } catch (error) {
      console.error("Error adding exercise:", error);
      toast.error("Failed to add exercise set");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteWorkout = () => {
    toast.success("Workout completed!");
    navigate("/workouts");
  };

  // Format time for the rest timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Get all completed sets for a specific exercise
  const getCompletedSetsForExercise = (exerciseName: string) => {
    return completedSets.filter(set => set.exercise === exerciseName);
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

      {restTimerActive && (
        <Card className="border-l-4 border-l-fitness-600">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-fitness-600" />
                  <span className="font-medium">Resting for {formatTime(restTimeRemaining)}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    clearInterval(timerInterval.current as number);
                    setRestTimerActive(false);
                  }}
                >
                  Skip
                </Button>
              </div>
              <Progress value={(restTimeRemaining / (exerciseRecords[activeExerciseIndex as number]?.rest || 1)) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

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
              {exerciseRecords.map((exercise, index) => {
                const exerciseSets = getCompletedSetsForExercise(exercise.exercise);
                
                return (
                  <TableRow key={`${exercise.exercise}-${index}`} className={activeExerciseIndex === index && restTimerActive ? "bg-muted/30" : ""}>
                    <TableCell>
                      <div className="font-medium">
                        {exercise.exercise}
                        {exerciseSets.length > 0 && (
                          <Badge variant="outline" className="ml-2">
                            <Repeat className="mr-1 h-3 w-3" /> 
                            {exerciseSets.length} {exerciseSets.length === 1 ? 'set' : 'sets'}
                          </Badge>
                        )}
                      </div>
                      
                      {exerciseSets.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {exerciseSets.map((set, idx) => (
                            <div key={set.uuid || idx} className="mt-1 flex items-center gap-x-2">
                              <span>Set {idx + 1}:</span>
                              {set.reps && <span>{set.reps} reps</span>}
                              {set.weight && <span>{set.weight} kg</span>}
                              {set.duration && <span>{set.duration} sec</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
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
                        disabled={saving || (activeExerciseIndex !== null && restTimerActive)}
                        className="bg-fitness-600 hover:bg-fitness-700"
                      >
                        <Plus className="mr-1 h-4 w-4" /> Add Set
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
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
