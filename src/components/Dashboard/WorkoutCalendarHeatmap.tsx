
import { useState, useMemo } from "react";
import { WorkoutRecord } from "@/types/api";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";
import { format, subMonths, eachDayOfInterval, getDay, isSameDay } from "date-fns";

interface WorkoutCalendarHeatmapProps {
  workoutRecords: WorkoutRecord[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_TO_SHOW = 3;

const WorkoutCalendarHeatmap = ({ workoutRecords }: WorkoutCalendarHeatmapProps) => {
  const [activeCell, setActiveCell] = useState<any | null>(null);

  // Generate data for heatmap
  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = subMonths(today, MONTHS_TO_SHOW);
    
    // Get all days between start date and today
    const days = eachDayOfInterval({ start: startDate, end: today });
    
    // Create data points for each day
    return days.map(day => {
      // Find workout records for this day
      const dayRecords = workoutRecords.filter(record => 
        isSameDay(new Date(record.datetime), day)
      );
      
      // Calculate intensity based on number of workouts for the day
      const intensity = dayRecords.length;
      
      return {
        date: day,
        weekday: getDay(day), // 0-6, starting with Sunday
        weekOfMonth: Math.floor((day.getDate() - 1) / 7),
        month: day.getMonth(),
        intensity,
        records: dayRecords,
      };
    });
  }, [workoutRecords]);

  // Function to determine cell color based on workout intensity
  const getCellColor = (intensity: number) => {
    if (intensity === 0) return "#f1f1f1";
    if (intensity === 1) return "#d6e685";
    if (intensity === 2) return "#8cc665";
    return "#44a340"; // 3 or more
  };
  
  // Format tooltip content
  const formatTooltip = (data: any) => {
    if (!data) return null;
    
    const { date, intensity, records } = data;
    return (
      <div className="p-2">
        <div className="font-medium">{format(date, "MMMM d, yyyy")}</div>
        <div className="text-sm">
          {intensity === 0 
            ? "No workouts" 
            : `${intensity} workout${intensity > 1 ? 's' : ''}`}
        </div>
        {records.length > 0 && (
          <div className="mt-1 pt-1 border-t border-border/50">
            {records.slice(0, 3).map((record: WorkoutRecord, i: number) => (
              <div key={i} className="text-xs truncate">
                • {record.workout_name}
              </div>
            ))}
            {records.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{records.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-48 md:h-64">
      <ChartContainer
        config={{
          heatmap: {
            label: "Workout Heatmap",
            color: "#44a340"
          },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
          >
            <XAxis
              type="category"
              dataKey="weekday"
              name="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              ticks={[0, 1, 2, 3, 4, 5, 6]}
              tickFormatter={(value) => DAYS[value]}
            />
            <YAxis
              reversed
              type="number"
              dataKey="weekOfMonth"
              name="week"
              tick={false}
              tickLine={false}
              axisLine={false}
              width={0}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return formatTooltip(payload[0].payload);
                }
                return null;
              }}
            />
            <Scatter data={heatmapData} shape="square">
              {heatmapData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  width={18}
                  height={18}
                  fill={getCellColor(entry.intensity)}
                  onMouseEnter={() => setActiveCell(entry)}
                  onMouseLeave={() => setActiveCell(null)}
                  className="cursor-pointer hover:stroke-border hover:stroke-1"
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default WorkoutCalendarHeatmap;
