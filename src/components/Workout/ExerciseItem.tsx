
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
  dragHandleProps 
}: ExerciseItemProps) => {
  const handleChange = (field: keyof WorkoutExercise, value: any) => {
    onUpdate(exercise.uuid, { [field]: value });
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div 
              {...dragHandleProps} 
              className="cursor-grab mr-3 p-1 rounded hover:bg-muted"
            >
              <Grip className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-medium">{exercise.exercise}</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onRemove(exercise.uuid)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <Label htmlFor={`sets-${exercise.uuid}`}>Sets</Label>
            <Input
              id={`sets-${exercise.uuid}`}
              type="number"
              min="1"
              value={exercise.sets}
              onChange={(e) => handleChange("sets", parseInt(e.target.value, 10) || 1)}
            />
          </div>
          <div>
            <Label htmlFor={`rest-${exercise.uuid}`}>Rest (seconds)</Label>
            <Input
              id={`rest-${exercise.uuid}`}
              type="number"
              min="0"
              value={exercise.rest}
              onChange={(e) => handleChange("rest", parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {exercise.reps !== null && (
            <div>
              <Label htmlFor={`reps-${exercise.uuid}`}>Reps</Label>
              <Input
                id={`reps-${exercise.uuid}`}
                type="number"
                min="0"
                value={exercise.reps || 0}
                onChange={(e) => handleChange("reps", parseInt(e.target.value, 10) || 0)}
              />
            </div>
          )}
          {exercise.duration !== null && (
            <div>
              <Label htmlFor={`duration-${exercise.uuid}`}>Duration (seconds)</Label>
              <Input
                id={`duration-${exercise.uuid}`}
                type="number"
                min="0"
                value={exercise.duration || 0}
                onChange={(e) => handleChange("duration", parseInt(e.target.value, 10) || 0)}
              />
            </div>
          )}
          <div className="col-span-2">
            <Label htmlFor={`notes-${exercise.uuid}`}>Notes (optional)</Label>
            <Input
              id={`notes-${exercise.uuid}`}
              value={exercise.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseItem;
