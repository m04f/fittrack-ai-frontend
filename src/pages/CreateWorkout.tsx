
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Dumbbell, Save } from "lucide-react";
import { WorkoutExercise, Workout } from "@/types/api";
import ExerciseItem from "@/components/Workout/ExerciseItem";
import ExerciseSelector from "@/components/Workout/ExerciseSelector";
import api from "@/services/api";

const CreateWorkout = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [workout, setWorkout] = useState<Partial<Workout>>({
    name: "",
    description: "",
    notes: "",
    public: true,
    exercises: [],
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const uuid = searchParams.get("uuid");

    if (uuid) {
      setWorkoutId(uuid);
      api.getWorkout(uuid)
        .then((data) => {
          setWorkout(data);
        })
        .catch(() => {
          toast.error("Failed to load workout for editing");
        });
    }
  }, []);

  const updateWorkoutField = (field: keyof Workout, value: any) => {
    setWorkout((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddExercise = (exercise: WorkoutExercise) => {
    setWorkout((prev) => {
      const currentExercises = prev.exercises || [];
      const newExercise = {
        ...exercise,
        order: currentExercises.length,
      };
      
      return {
        ...prev,
        exercises: [...currentExercises, newExercise],
      };
    });
  };

  const handleUpdateExercise = (uuid: string, updates: Partial<WorkoutExercise>) => {
    setWorkout((prev) => {
      const currentExercises = prev.exercises || [];
      return {
        ...prev,
        exercises: currentExercises.map((ex) =>
          ex.uuid === uuid ? { ...ex, ...updates } : ex
        ),
      };
    });
  };

  const handleRemoveExercise = (uuid: string) => {
    setWorkout((prev) => {
      const currentExercises = prev.exercises || [];
      const filteredExercises = currentExercises.filter((ex) => ex.uuid !== uuid);
      
      // Re-order the remaining exercises
      const reorderedExercises = filteredExercises.map((ex, index) => ({
        ...ex,
        order: index,
      }));
      
      return {
        ...prev,
        exercises: reorderedExercises,
      };
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return; // Dropped outside the list

    const items = Array.from(workout.exercises || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the order property for each item
    const updatedExercises = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setWorkout((prev) => ({
      ...prev,
      exercises: updatedExercises,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workout.name?.trim()) {
      toast.error("Workout name is required");
      return;
    }

    if (!workout.exercises?.length) {
      toast.error("Add at least one exercise to your workout");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare data for API
      const workoutData = {
        ...workout,
        exercises: workout.exercises.map(ex => ({
          ...ex,
          // Ensure we only send fields the API expects
          uuid: ex.uuid,
          exercise: ex.exercise,
          order: ex.order,
          sets: ex.sets,
          rest: ex.rest,
          reps: ex.reps,
          duration: ex.duration,
          weight: ex.weight,
          notes: ex.notes,
        })),
      };
      
      let response;
      if (workoutId) {
        response = await api.updateWorkout(workoutId, workoutData);
        toast.success("Workout updated successfully!");
      } else {
        response = await api.createWorkout(workoutData);
        toast.success("Workout created successfully!");
      }
      navigate(`/workouts/${response.uuid}`);
    } catch (error) {
      console.error("Error creating workout:", error);
      toast.error("Failed to create workout");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-enter space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/workouts")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workouts
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight mt-2 sm:mt-0">Create New Workout</h1>
        </div>
        <div className="shrink-0">
          <Button
            className="bg-fitness-600 hover:bg-fitness-700"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? (workoutId ? "Updating..." : "Creating...") : (workoutId ? "Update Workout" : "Create Workout")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the details of your new workout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workout-name">Workout Name</Label>
                  <Input
                    id="workout-name"
                    placeholder="Full Body Workout"
                    value={workout.name}
                    onChange={(e) => updateWorkoutField("name", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="workout-description">Description</Label>
                  <Textarea
                    id="workout-description"
                    placeholder="A brief description of this workout..."
                    value={workout.description || ""}
                    onChange={(e) => updateWorkoutField("description", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="workout-notes">Notes (Optional)</Label>
                  <Textarea
                    id="workout-notes"
                    placeholder="Any additional notes..."
                    value={workout.notes || ""}
                    onChange={(e) => updateWorkoutField("notes", e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="workout-public"
                    checked={!!workout.public}
                    onCheckedChange={(checked) => updateWorkoutField("public", checked)}
                  />
                  <Label htmlFor="workout-public">Make this workout public</Label>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Exercises</CardTitle>
              <CardDescription>
                Add and arrange exercises for your workout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="exercises">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {workout.exercises && workout.exercises.length > 0 ? (
                        workout.exercises.map((exercise, index) => (
                          <Draggable
                            key={exercise.uuid}
                            draggableId={exercise.uuid}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                              >
                                <ExerciseItem
                                  exercise={exercise}
                                  onUpdate={handleUpdateExercise}
                                  onRemove={handleRemoveExercise}
                                  dragHandleProps={provided.dragHandleProps}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium">No exercises added yet</h3>
                          <p className="text-sm text-muted-foreground mt-1 mb-4">
                            Use the Add Exercise button to build your workout
                          </p>
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              
              <div className="mt-6 flex justify-center">
                <ExerciseSelector onAddExercise={handleAddExercise} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Workout Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Name
                  </p>
                  <p className="font-medium">
                    {workout.name || "Untitled Workout"}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Exercise Count
                  </p>
                  <p className="font-medium">
                    {workout.exercises?.length || 0} exercises
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Visibility
                  </p>
                  <p className="font-medium">
                    {workout.public ? "Public" : "Private"}
                  </p>
                </div>
                
                {workout.exercises && workout.exercises.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Exercise List
                      </p>
                      <ul className="space-y-1 text-sm">
                        {workout.exercises.map((ex, index) => (
                          <li key={ex.uuid} className="flex items-center">
                            <span className="text-muted-foreground mr-2">
                              {index + 1}.
                            </span>
                            {ex.exercise}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkout;
