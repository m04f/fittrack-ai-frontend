
import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Clock,
  Dumbbell,
  Check,
  Plus,
  Weight,
  Timer,
  Repeat,
  Activity,
  Bell,
  Play,
  Pause,
  X,
} from "lucide-react";
import api from "@/services/api";
import {
  Workout,
  WorkoutExercise,
  WorkoutRecord,
  ExerciseRecord,
} from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const WorkoutRecordDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [workoutRecord, setWorkoutRecord] = useState<WorkoutRecord | null>(
    null,
  );
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [completedSets, setCompletedSets] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Rest timer state
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(
    null,
  );
  const timerInterval = useRef<number | null>(null);
  
  // Exercise timer state
  const [exerciseTimerActive, setExerciseTimerActive] = useState(false);
  const [exerciseTimeRemaining, setExerciseTimeRemaining] = useState(0);
  const [activeExerciseTimerIndex, setActiveExerciseTimerIndex] = useState<number | null>(null);
  const exerciseTimerInterval = useRef<number | null>(null);

  // Sound effect reference
  const timerAudioRef = useRef<HTMLAudioElement | null>(null);

  // Workout progress tracking
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const workoutTimerInterval = useRef<number | null>(null);

  useEffect(() => {
    // Initialize audio element
    timerAudioRef.current = new Audio("/timer-bell.mp3");
    
    return () => {
      // Cleanup audio
      if (timerAudioRef.current) {
        timerAudioRef.current.pause();
        timerAudioRef.current = null;
      }
    };
  }, []);

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
          const initialExercises = workoutData.exercises.map((ex) => ({
            uuid: "",
            exercise: ex.exercise,
            reps: ex.reps || null,
            weight: ex.weight || null,
            duration: ex.duration || null,
            rest: ex.rest || null,
            pre: null,
            datetime: new Date().toISOString(),
            workout_record: id,
          }));

          setExerciseRecords(initialExercises);
        }

        // Initialize the workout timer
        setWorkoutStartTime(new Date());
      } catch (error) {
        console.error("Error fetching workout record data:", error);
        toast.error("Failed to load workout record");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Clean up timer on unmount
    return () => {
      if (workoutTimerInterval.current) {
        clearInterval(workoutTimerInterval.current);
      }
    };
  }, [id]);

  // Rest timer effect
  useEffect(() => {
    if (restTimerActive && restTimeRemaining > 0) {
      timerInterval.current = window.setInterval(() => {
        setRestTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval.current as number);
            setRestTimerActive(false);
            playTimerSound();
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

  // Exercise timer effect
  useEffect(() => {
    if (exerciseTimerActive && exerciseTimeRemaining > 0 && activeExerciseTimerIndex !== null) {
      exerciseTimerInterval.current = window.setInterval(() => {
        setExerciseTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(exerciseTimerInterval.current as number);
            setExerciseTimerActive(false);
            playTimerSound();
            
            // Auto-log the exercise when timer finishes
            handleAddExercise(activeExerciseTimerIndex);
            
            toast.success("Exercise completed!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (exerciseTimerInterval.current) {
        clearInterval(exerciseTimerInterval.current);
      }
    };
  }, [exerciseTimerActive, exerciseTimeRemaining]);

  // Workout timer effect
  useEffect(() => {
    if (workoutStartTime) {
      workoutTimerInterval.current = window.setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - workoutStartTime.getTime()) / 1000,
        );
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (workoutTimerInterval.current) {
        clearInterval(workoutTimerInterval.current);
      }
    };
  }, [workoutStartTime]);

  const playTimerSound = () => {
    if (timerAudioRef.current) {
      timerAudioRef.current.currentTime = 0;
      timerAudioRef.current.play().catch(error => {
        console.error("Error playing sound:", error);
      });
    }
  };

  const handleExerciseChange = (
    index: number,
    field: keyof ExerciseRecord,
    value: any,
  ) => {
    const updatedExercises = [...exerciseRecords];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value,
    };
    setExerciseRecords(updatedExercises);
  };

  const startExerciseTimer = (index: number) => {
    const exercise = exerciseRecords[index];
    if (!exercise || !exercise.duration) return;

    setExerciseTimeRemaining(exercise.duration);
    setExerciseTimerActive(true);
    setActiveExerciseTimerIndex(index);
    toast.info(`Exercise timer started: ${exercise.duration} seconds`);
  };

  const cancelExerciseTimer = () => {
    if (exerciseTimerInterval.current) {
      clearInterval(exerciseTimerInterval.current);
      exerciseTimerInterval.current = null;
    }
    setExerciseTimerActive(false);
    setActiveExerciseTimerIndex(null);
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
        duration: exerciseToAdd.duration,
      };

      const response = await api.createExerciseRecord(
        exerciseData,
        workoutRecord.uuid,
      );

      // Add the new set to completed sets
      setCompletedSets((prev) => [...prev, { ...response, saved: true }]);

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

  const handleCompleteWorkout = async () => {
      if (!workoutRecord || !workoutStartTime) {
        toast.error("Unable to complete workout. Missing data.");
        return;
      }

      const now = new Date();
      const duration = Math.floor((now.getTime() - workoutStartTime.getTime()) / 1000);

      try {
        await api.patchWorkoutRecord(workoutRecord.uuid, { duration });
        toast.success("Workout completed!");
        navigate("/workouts");
      } catch (error) {
        console.error("Error updating workout duration:", error);
        toast.error("Failed to update workout duration.");
      }
    };

  // Format time for the rest timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Format time for workout elapsed time (includes hours)
  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  // Get all completed sets for a specific exercise
  const getCompletedSetsForExercise = (exerciseName: string) => {
    return completedSets.filter((set) => set.exercise === exerciseName);
  };

  // Calculate progress for individual exercise
  const calculateExerciseProgress = (exerciseName: string) => {
    if (!workout || !workout.exercises) return 0;

    const workoutExercise = workout.exercises.find(
      (ex) => ex.exercise === exerciseName,
    );
    if (!workoutExercise) return 0;

    const completedExerciseSets = completedSets.filter(
      (set) => set.exercise === exerciseName,
    );
    const targetSets = workoutExercise.sets || 1;

    return Math.min(
      100,
      Math.round((completedExerciseSets.length / targetSets) * 100),
    );
  };

  // Calculate overall workout progress
  const calculateWorkoutProgress = () => {
    if (!workout || !workout.exercises || workout.exercises.length === 0)
      return 0;

    const totalSets = workout.exercises.reduce(
      (total, ex) => total + (ex.sets || 1),
      0,
    );
    const completedSetsCount = completedSets.length;

    return Math.min(100, Math.round((completedSetsCount / totalSets) * 100));
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link to="/workouts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Recording: {workout?.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{formatElapsedTime(elapsedTime)}</span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div>Workout Progress</div>
            <Badge variant="outline" className="ml-2">
              {calculateWorkoutProgress()}% Complete
            </Badge>
          </CardTitle>
          <CardDescription>
            Track your overall workout completion
          </CardDescription>
          <Progress value={calculateWorkoutProgress()} className="h-2" />
        </CardHeader>
      </Card>

      {/* Rest Timer Dialog */}
      <Dialog open={restTimerActive} onOpenChange={(open) => !open && setRestTimerActive(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <div className="flex items-center">
                <Timer className="h-5 w-5 text-fitness-600 mr-2" />
                Rest Timer
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 p-0" 
                onClick={() => setRestTimerActive(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="text-4xl font-bold text-fitness-600">
              {formatTime(restTimeRemaining)}
            </div>
            <Progress
              value={(restTimeRemaining / (exerciseRecords[activeExerciseIndex as number]?.rest || 1)) * 100}
              className="h-2 w-full"
            />
            <p className="text-sm text-muted-foreground">
              Resting after {exerciseRecords[activeExerciseIndex as number]?.exercise}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearInterval(timerInterval.current as number);
                setRestTimerActive(false);
              }}
            >
              Skip Rest
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise Timer Dialog */}
      <Dialog open={exerciseTimerActive} onOpenChange={(open) => !open && cancelExerciseTimer()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <div className="flex items-center">
                <Dumbbell className="h-5 w-5 text-fitness-600 mr-2" />
                Exercise Timer
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 p-0" 
                onClick={cancelExerciseTimer}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="text-4xl font-bold text-fitness-600">
              {formatTime(exerciseTimeRemaining)}
            </div>
            <Progress
              value={(exerciseTimeRemaining / (exerciseRecords[activeExerciseTimerIndex as number]?.duration || 1)) * 100}
              className="h-2 w-full"
            />
            <p className="text-sm text-muted-foreground">
              {exerciseRecords[activeExerciseTimerIndex as number]?.exercise}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelExerciseTimer}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-fitness-600 hover:bg-fitness-700"
                onClick={() => {
                  cancelExerciseTimer();
                  if (activeExerciseTimerIndex !== null) {
                    handleAddExercise(activeExerciseTimerIndex);
                  }
                }}
              >
                Complete Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Exercise Progress</CardTitle>
          <CardDescription>Record your sets for each exercise</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Exercise</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>Weight (kg)</TableHead>
                <TableHead>Duration (sec)</TableHead>
                <TableHead>Rest (sec)</TableHead>
                <TableHead>Effort</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exerciseRecords.map((exercise, index) => {
                const exerciseSets = getCompletedSetsForExercise(
                  exercise.exercise,
                );
                const exerciseProgress = calculateExerciseProgress(
                  exercise.exercise,
                );
                const isTimerActive = activeExerciseTimerIndex === index;

                return (
                  <TableRow
                    key={`${exercise.exercise}-${index}`}
                    className={
                      (activeExerciseIndex === index && restTimerActive) ||
                      (activeExerciseTimerIndex === index && exerciseTimerActive)
                        ? "bg-muted/30"
                        : ""
                    }
                  >
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{exercise.exercise}</div>
                          <Badge variant="outline" className="ml-2">
                            <Repeat className="mr-1 h-3 w-3" />
                            {exerciseSets.length}{" "}
                            {exerciseSets.length === 1 ? "set" : "sets"}
                          </Badge>
                        </div>
                        <Progress value={exerciseProgress} className="h-1" />

                        {exerciseSets.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {exerciseSets.map((set, idx) => (
                              <div
                                key={set.uuid || idx}
                                className="mt-1 flex items-center gap-x-2"
                              >
                                <span>Set {idx + 1}:</span>
                                {set.reps && <span>{set.reps} reps</span>}
                                {set.weight && <span>{set.weight} kg</span>}
                                {set.duration && (
                                  <span>{set.duration} sec</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        className="w-20"
                        value={exercise.reps || ""}
                        onChange={(e) =>
                          handleExerciseChange(
                            index,
                            "reps",
                            e.target.value ? parseInt(e.target.value) : null,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-20"
                        value={exercise.weight || ""}
                        onChange={(e) =>
                          handleExerciseChange(
                            index,
                            "weight",
                            e.target.value ? parseFloat(e.target.value) : null,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        className="w-20"
                        value={exercise.duration || ""}
                        onChange={(e) =>
                          handleExerciseChange(
                            index,
                            "duration",
                            e.target.value ? parseInt(e.target.value) : null,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        className="w-20"
                        value={exercise.rest || ""}
                        onChange={(e) =>
                          handleExerciseChange(
                            index,
                            "rest",
                            e.target.value ? parseInt(e.target.value) : null,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center mt-2">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={exercise.pre || 1}
                          onChange={(e) =>
                            handleExerciseChange(
                              index,
                              "pre",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full"
                        />
                        <span className="text-sm mt-1">
                          Effort: {exercise.pre || 1}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddExercise(index)}
                          disabled={
                            saving ||
                            (activeExerciseIndex !== null && restTimerActive) ||
                            exerciseTimerActive
                          }
                          className="bg-fitness-600 hover:bg-fitness-700"
                        >
                          <Plus className="mr-1 h-4 w-4" /> Add Set
                        </Button>
                        
                        {exercise.duration && exercise.duration > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startExerciseTimer(index)}
                            disabled={exerciseTimerActive || restTimerActive}
                          >
                            <Timer className="mr-1 h-4 w-4" /> Start
                          </Button>
                        )}
                      </div>
                      
                      {isTimerActive && exerciseTimerActive && (
                        <div className="flex items-center text-xs text-fitness-600">
                          <Timer className="h-3 w-3 mr-1" />
                          Timer active: {formatTime(exerciseTimeRemaining)}
                        </div>
                      )}
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
      
      {/* Audio element for timer sound */}
      <audio src="/timer-bell.mp3" ref={timerAudioRef} />
    </div>
  );
};

export default WorkoutRecordDetail;
