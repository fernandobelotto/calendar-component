"use client";

import { useMemo } from "react";
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
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

export function WeekView() {
  const {
    currentDate,
    selectedDate,
    setSelectedDate,
    getEventsForDate,
    openAddModal,
  } = useCalendar();

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={format(currentDate, "yyyy-ww")}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-7 gap-2 h-full"
      >
        {weekDays.map((day) => {
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
                onDoubleClick={() => openAddModal(day)}
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
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
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
