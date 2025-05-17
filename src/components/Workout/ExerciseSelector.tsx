
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { Exercise, WorkoutExercise } from "@/types/api";
import api from "@/services/api";
import { v4 as uuidv4 } from "@/lib/uuid";

interface ExerciseSelectorProps {
  onAddExercise: (exercise: WorkoutExercise) => void;
}

const ExerciseSelector = ({ onAddExercise }: ExerciseSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      setIsLoading(true);
      try {
        const result = await api.getExercises();
        setExercises(result);
        setFilteredExercises(result);
      } catch (error) {
        console.error("Failed to fetch exercises:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchExercises();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredExercises(filtered);
    } else {
      setFilteredExercises(exercises);
    }
  }, [searchTerm, exercises]);

  const handleAddExercise = (exerciseName: string) => {
    const newExercise: WorkoutExercise = {
      uuid: uuidv4(),
      exercise: exerciseName,
      order: 0, // This will be set by the parent component
      reps: 10,
      weight: null,
      duration: null,
      sets: 3,
      rest: 60,
      notes: "",
    };

    onAddExercise(newExercise);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-fitness-600 hover:bg-fitness-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Exercise
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="max-h-[400px] overflow-y-auto mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">Loading exercises...</div>
          ) : filteredExercises.length > 0 ? (
            <div className="grid gap-2">
              {filteredExercises.map((exercise) => (
                <Button
                  key={exercise.name}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => handleAddExercise(exercise.name)}
                >
                  <div className="text-left">
                    <div className="font-medium">{exercise.name}</div>
                    {exercise.muscles && exercise.muscles.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Targets: {exercise.muscles.join(", ")}
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No exercises found. Try a different search term."
                : "No exercises available."}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseSelector;
