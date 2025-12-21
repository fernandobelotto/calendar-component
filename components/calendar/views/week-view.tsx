"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  isSameDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useCalendar } from "../calendar-context";
import { EventCard } from "../event-card";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const columnVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

export function WeekView() {
  const {
    currentDate,
    selectedDate,
    setSelectedDate,
    setCurrentDate,
    setViewMode,
    getEventsForDate,
    openAddModal,
    config,
  } = useCalendar();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoverInfo, setHoverInfo] = useState<{ dayIndex: number; y: number } | null>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Update current time every minute for the timeline
  useEffect(() => {
    if (config.weekView?.hideTimeline) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [config.weekView?.hideTimeline]);

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: config.weekStartsOn });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: config.weekStartsOn });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate, config.weekStartsOn]);

  // Handle double click to shift to daily view
  const handleDayDoubleClick = useCallback(
    (day: Date) => {
      if (config.weekView?.enableDoubleClickToShiftViewToDaily) {
        setCurrentDate(day);
        setViewMode("day");
      } else {
        openAddModal(day);
      }
    },
    [config.weekView?.enableDoubleClickToShiftViewToDaily, setCurrentDate, setViewMode, openAddModal]
  );

  // Handle mouse move for hover line
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
      if (config.weekView?.hideHoverLine) return;

      const rect = columnRefs.current[dayIndex]?.getBoundingClientRect();
      if (!rect) return;

      const y = e.clientY - rect.top;
      setHoverInfo({ dayIndex, y });
    },
    [config.weekView?.hideHoverLine]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  // Calculate timeline position for today
  const getTimelinePosition = useCallback(() => {
    const now = currentTime;
    // This is a simplified timeline - shows as a percentage of the day
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / (24 * 60)) * 100;
  }, [currentTime]);

  const timelinePosition = getTimelinePosition();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={format(currentDate, "yyyy-ww")}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-7 gap-2 h-full"
      >
        {weekDays.map((day, dayIndex) => {
          const events = getEventsForDate(day);
          const isDayToday = isToday(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <motion.div
              key={day.toISOString()}
              variants={columnVariants}
              className={cn(
                "flex flex-col rounded-lg border border-border overflow-hidden",
                isSelected && "ring-2 ring-primary"
              )}
            >
              {/* Day Header */}
              <button
                onClick={() => setSelectedDate(day)}
                onDoubleClick={() => handleDayDoubleClick(day)}
                className={cn(
                  "p-3 text-center border-b border-border transition-colors hover:bg-accent/50",
                  isDayToday && "bg-primary/10"
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-lg font-semibold mt-1",
                    isDayToday && "text-primary"
                  )}
                >
                  {format(day, "d")}
                </div>
              </button>

              {/* Events */}
              <div
                ref={(el) => { columnRefs.current[dayIndex] = el; }}
                className="flex-1 p-2 space-y-2 overflow-y-auto relative"
                onMouseMove={(e) => handleMouseMove(e, dayIndex)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Current time indicator (timeline) */}
                {!config.weekView?.hideTimeline && isDayToday && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top: `${timelinePosition}%` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="flex-1 h-0.5 bg-red-500" />
                    </div>
                  </div>
                )}

                {/* Hover line indicator */}
                {!config.weekView?.hideHoverLine && hoverInfo?.dayIndex === dayIndex && (
                  <div
                    className="absolute left-0 right-0 z-5 pointer-events-none"
                    style={{ top: `${hoverInfo.y}px` }}
                  >
                    <div className="h-px bg-primary/50 border-dashed" />
                  </div>
                )}

                <AnimatePresence mode="popLayout">
                  {events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <EventCard event={event} variant="compact" />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {events.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No events
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
