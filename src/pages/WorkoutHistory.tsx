import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight, Dumbbell, History } from "lucide-react";
import { formatDistance, format } from "date-fns";
import api from "@/services/api";
import { WorkoutRecord } from "@/types/api";

const WorkoutHistory = () => {
  const [workoutRecords, setWorkoutRecords] = useState<WorkoutRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkoutRecords = async () => {
      setLoading(true);
      try {
        const records = await api.getWorkoutRecords();
        setWorkoutRecords(records || []);
      } catch (error) {
        console.error("Error fetching workout records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutRecords();
  }, []);

  // Format duration from seconds to readable format
  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return "N/A";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
      return `${minutes}m`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  return (
    <div className="animate-enter space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-fitness-600 to-fitness-700 bg-clip-text text-transparent">Workout History</h1>
        <p className="text-muted-foreground">
          View your past workout records and performance
        </p>
      </div>

      <Card className="fitness-card border-2 border-fitness-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-fitness-700 dark:text-fitness-400">
            <History className="h-5 w-5 text-fitness-600" />
            Your Workout Records
          </CardTitle>
          <CardDescription>Track your progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : workoutRecords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workout Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Exercises</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workoutRecords.map((record) => (
                  <TableRow key={record.uuid}>
                    <TableCell className="font-medium">
                      {record.workout_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {format(new Date(record.datetime), "MMM d, yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistance(
                            new Date(record.datetime),
                            new Date(),
                            {
                              addSuffix: true,
                            },
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDuration(record.duration)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 w-fit border-fitness-200/50"
                      >
                        <Dumbbell className="h-3 w-3 text-fitness-600" />
                        {record.exercises.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline" className="border-2 border-fitness-600 text-fitness-600 hover:bg-fitness-600 hover:text-white transition-all duration-200">
                        <Link to={`/history/${record.uuid}`}>
                          Details
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-fitness-500 to-fitness-600 flex items-center justify-center mb-4 shadow-lg">
                <History className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-medium">No workout records found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start recording workouts to track your progress
              </p>
              <Button
                className="mt-4 bg-gradient-to-r from-fitness-600 to-fitness-700 hover:from-fitness-700 hover:to-fitness-800 text-white font-semibold shadow-lg transition-all duration-200"
                asChild
              >
                <Link to="/workouts">Find a Workout</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutHistory;
