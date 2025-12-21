"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useCalendar } from "../calendar-context";
import { EventCard, MoreEventsButton } from "../event-card";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE_EVENTS = 2;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.1,
    },
  },
  exit: { opacity: 0 },
};

const dayVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

export function MonthView() {
  const {
    currentDate,
    selectedDate,
    setSelectedDate,
    getEventsForDate,
    openAddModal,
    navigationDirection,
  } = useCalendar();

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Group days into weeks
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleDayDoubleClick = (day: Date) => {
    openAddModal(day);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={format(currentDate, "yyyy-MM")}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex-1 grid grid-cols-7 auto-rows-fr"
        >
          {calendarDays.map((day, index) => {
            const events = getEventsForDate(day);
            const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS);
            const hiddenCount = events.length - MAX_VISIBLE_EVENTS;
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isDayToday = isToday(day);

            return (
              <motion.div
                key={day.toISOString()}
                variants={dayVariants}
                onClick={() => handleDayClick(day)}
                onDoubleClick={() => handleDayDoubleClick(day)}
                className={cn(
                  "min-h-[120px] p-2 border-b border-r border-border cursor-pointer transition-colors",
                  "hover:bg-accent/30",
                  !isCurrentMonth && "bg-muted/30",
                  isSelected && "bg-accent/50"
                )}
              >
                {/* Day Number */}
                <div className="flex justify-start mb-1">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-7 h-7 text-sm rounded-full",
                      isDayToday &&
                        "bg-primary text-primary-foreground font-semibold",
                      !isDayToday && !isCurrentMonth && "text-muted-foreground",
                      !isDayToday && isCurrentMonth && "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Events */}
                <div className="space-y-1">
                  <AnimatePresence mode="popLayout">
                    {visibleEvents.map((event, eventIndex) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ delay: eventIndex * 0.05 }}
                      >
                        <EventCard event={event} variant="compact" />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {hiddenCount > 0 && (
                    <MoreEventsButton
                      count={hiddenCount}
                      onClick={() => {
                        setSelectedDate(day);
                        // Could open a modal or switch to day view here
                      }}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
