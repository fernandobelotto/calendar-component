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
  isToday,
  format,
  isSameDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useCalendar } from "../calendar-context";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
};

const monthVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

export function YearView() {
  const {
    currentDate,
    selectedDate,
    setSelectedDate,
    setCurrentDate,
    setViewMode,
    getEventsForDate,
    config,
  } = useCalendar();

  const currentYear = currentDate.getFullYear();

  const handleMonthDoubleClick = (monthIndex: number) => {
    if (config.yearView?.enableDoubleClickToShiftViewToMonthly) {
      const newDate = new Date(currentYear, monthIndex, 1);
      setCurrentDate(newDate);
      setViewMode("month");
    }
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentYear}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 md:grid-cols-4 gap-4 p-2"
        >
          {MONTHS.map((monthName, monthIndex) => (
            <MiniMonth
              key={monthIndex}
              year={currentYear}
              monthIndex={monthIndex}
              monthName={monthName}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
              onMonthDoubleClick={() => handleMonthDoubleClick(monthIndex)}
              getEventsForDate={getEventsForDate}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

type MiniMonthProps = {
  year: number;
  monthIndex: number;
  monthName: string;
  selectedDate: Date | null;
  onDayClick: (day: Date) => void;
  onMonthDoubleClick: () => void;
  getEventsForDate: (date: Date) => unknown[];
};

function MiniMonth({
  year,
  monthIndex,
  monthName,
  selectedDate,
  onDayClick,
  onMonthDoubleClick,
  getEventsForDate,
}: MiniMonthProps) {
  const monthDate = useMemo(() => new Date(year, monthIndex, 1), [year, monthIndex]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [monthDate]);

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === monthIndex;
  }, [year, monthIndex]);

  return (
    <motion.div
      variants={monthVariants}
      className={cn(
        "rounded-lg border border-border p-3",
        isCurrentMonth && "ring-2 ring-primary/50"
      )}
      onDoubleClick={onMonthDoubleClick}
    >
      {/* Month Header */}
      <h3
        className={cn(
          "text-sm font-semibold mb-2 text-center cursor-pointer hover:text-primary transition-colors",
          isCurrentMonth && "text-primary"
        )}
      >
        {monthName}
      </h3>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS_SHORT.map((day, i) => (
          <div
            key={i}
            className="text-[10px] text-muted-foreground text-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((day) => {
          const isInMonth = isSameMonth(day, monthDate);
          const isDayToday = isToday(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const events = getEventsForDate(day);
          const hasEvents = events.length > 0;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={cn(
                "relative w-6 h-6 text-[10px] rounded-full flex items-center justify-center transition-colors",
                !isInMonth && "text-muted-foreground/40",
                isInMonth && "hover:bg-accent/50",
                isDayToday && "bg-primary text-primary-foreground font-bold",
                isSelected && !isDayToday && "bg-accent ring-1 ring-primary"
              )}
            >
              {format(day, "d")}
              {hasEvents && isInMonth && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

