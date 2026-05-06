"use client";

import { GanttChart } from "@/components/ui/gantt-chart";

export default function CalendarPage() {
  return (
    <div>
      <GanttChart defaultView="weekly" showViewToggle={true} showTitle={true} />
    </div>
  );
}
