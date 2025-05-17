import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Grip, X } from "lucide-react";
import { WorkoutExercise } from "@/types/api";

interface ExerciseItemProps {
  exercise: WorkoutExercise;
  onUpdate: (uuid: string, updates: Partial<WorkoutExercise>) => void;
  onRemove: (uuid: string) => void;
  dragHandleProps?: any;
}

const ExerciseItem = ({
  exercise,
  onUpdate,
  onRemove,
  dragHandleProps,
}: ExerciseItemProps) => {
  const handleChange = (field: keyof WorkoutExercise, value: any) => {
    onUpdate(exercise.uuid, { [field]: value });
  };

  const compactView = (
    <div className="flex items-center justify-between p-2 border rounded mb-2">
      <div className="flex items-center">
        <div
          {...dragHandleProps}
          className="cursor-grab mr-3 p-1 rounded hover:bg-muted"
        >
          <Grip className="h-5 w-5 text-muted-foreground" />
        </div>
        <span className="font-medium">{exercise.exercise}</span>
        <div className="ml-auto grid grid-cols-4 gap-4 text-sm text-muted-foreground items-center">
          <div className="flex flex-col items-center">
            <label
              htmlFor={`sets-${exercise.uuid}`}
              className="text-xs font-medium"
            >
              Sets
            </label>
            <input
              id={`sets-${exercise.uuid}`}
              type="number"
              min="1"
              value={exercise.sets}
              onChange={(e) =>
                handleChange("sets", parseInt(e.target.value, 10) || 1)
              }
              className="w-16 border rounded px-1 text-center"
            />
          </div>
          <div className="flex flex-col items-center">
            <label
              htmlFor={`reps-${exercise.uuid}`}
              className="text-xs font-medium"
            >
              Reps
            </label>
            <input
              id={`reps-${exercise.uuid}`}
              type="number"
              min="0"
              value={exercise.reps || 0}
              onChange={(e) =>
                handleChange("reps", parseInt(e.target.value, 10) || 0)
              }
              className="w-16 border rounded px-1 text-center"
            />
          </div>
          <div className="flex flex-col items-center">
            <label
              htmlFor={`rest-${exercise.uuid}`}
              className="text-xs font-medium"
            >
              Rest
            </label>
            <input
              id={`rest-${exercise.uuid}`}
              type="number"
              min="0"
              value={exercise.rest || 0}
              onChange={(e) =>
                handleChange("rest", parseInt(e.target.value, 10) || 0)
              }
              className="w-16 border rounded px-1 text-center"
            />
          </div>
          <div className="flex flex-col items-center">
            <label
              htmlFor={`duration-${exercise.uuid}`}
              className="text-xs font-medium"
            >
              Duration (s)
            </label>
            <input
              id={`duration-${exercise.uuid}`}
              type="number"
              min="0"
              value={exercise.duration || 0}
              onChange={(e) =>
                handleChange("duration", parseInt(e.target.value, 10) || 0)
              }
              className="w-16 border rounded px-1 text-center"
            />
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(exercise.uuid)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  return compactView;
};

export default ExerciseItem;
