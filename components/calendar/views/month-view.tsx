"use client";

import { useMemo, useCallback } from "react";
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
  getWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useCalendar } from "../calendar-context";
import { EventCard, MoreEventsButton } from "../event-card";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

export function MonthView() {
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

  const maxVisibleEvents = config.monthView?.maxVisibleEvents ?? 2;
  const showOnlyCurrentMonth = config.monthView?.showOnlyCurrentMonth ?? false;
  const viewType = config.monthView?.viewType ?? "detailed";

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: config.weekStartsOn });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: config.weekStartsOn });

    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // If showOnlyCurrentMonth is true, filter to only show current month days
    if (showOnlyCurrentMonth) {
      return allDays.map((day) => ({
        date: day,
        isPlaceholder: !isSameMonth(day, currentDate),
      }));
    }

    return allDays.map((day) => ({
      date: day,
      isPlaceholder: false,
    }));
  }, [currentDate, config.weekStartsOn, showOnlyCurrentMonth]);

  // Group days into weeks
  const weeks = useMemo(() => {
    const result: { date: Date; isPlaceholder: boolean }[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  const handleDayClick = useCallback((day: Date) => {
    setSelectedDate(day);
  }, [setSelectedDate]);

  const handleDayDoubleClick = useCallback(
    (day: Date) => {
      if (config.monthView?.enableDoubleClickToShiftViewToWeekly) {
        setCurrentDate(day);
        setViewMode("week");
      } else {
        openAddModal(day);
      }
    },
    [config.monthView?.enableDoubleClickToShiftViewToWeekly, setCurrentDate, setViewMode, openAddModal]
  );

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
          {calendarDays.map(({ date: day, isPlaceholder }) => {
            // If it's a placeholder, render an empty cell
            if (isPlaceholder) {
              return (
                <motion.div
                  key={day.toISOString()}
                  variants={dayVariants}
                  className="min-h-[120px] p-2 border-b border-r border-border bg-muted/10"
                />
              );
            }

            const events = getEventsForDate(day);
            const visibleEvents = events.slice(0, maxVisibleEvents);
            const hiddenCount = events.length - maxVisibleEvents;
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isDayToday = isToday(day);

            // Basic view shows minimal information
            const isBasicView = viewType === "basic";

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
                  {isBasicView ? (
                    // Basic view: just show dots for events
                    events.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {events.slice(0, 5).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "w-2 h-2 rounded-full",
                              event.color === "blue" && "bg-blue-600",
                              event.color === "green" && "bg-green-700",
                              event.color === "yellow" && "bg-yellow-600",
                              event.color === "purple" && "bg-purple-600",
                              event.color === "red" && "bg-red-700"
                            )}
                          />
                        ))}
                        {events.length > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{events.length - 5}
                          </span>
                        )}
                      </div>
                    )
                  ) : (
                    // Detailed view: show event cards
                    <>
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
                            setCurrentDate(day);
                            setViewMode("day");
                          }}
                        />
                      )}
                    </>
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

