"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarProvider, useCalendar } from "./calendar-context";
import { CalendarHeader } from "./calendar-header";
import { MonthView, WeekView, DayView, ListView } from "./views";
import { EventModal } from "./event-modal";
import { CalendarEvent } from "./types";

// Sample events for demo
const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: "1",
    title: "Meeting A",
    description: "Team sync meeting",
    startDate: "2025-12-03",
    endDate: "2025-12-03",
    startTime: "10:00",
    endTime: "11:30",
    color: "blue",
  },
  {
    id: "2",
    title: "Meeting B",
    description: "Project planning",
    startDate: "2025-12-03",
    endDate: "2025-12-03",
    startTime: "10:00",
    endTime: "12:00",
    color: "blue",
  },
  {
    id: "3",
    title: "Meeting C",
    description: "Client call",
    startDate: "2025-12-03",
    endDate: "2025-12-03",
    startTime: "10:00",
    endTime: "13:00",
    color: "green",
  },
  {
    id: "4",
    title: "All-Day Project Sprint",
    description: "Sprint planning and execution",
    startDate: "2025-12-07",
    endDate: "2025-12-07",
    startTime: "00:00",
    endTime: "23:59",
    color: "red",
  },
  {
    id: "5",
    title: "International Client Call",
    description: "Quarterly review",
    startDate: "2025-12-09",
    endDate: "2025-12-09",
    startTime: "03:00",
    endTime: "04:00",
    color: "green",
  },
  {
    id: "6",
    title: "Team Standup",
    description: "Daily standup meeting",
    startDate: "2025-12-09",
    endDate: "2025-12-09",
    startTime: "05:30",
    endTime: "06:30",
    color: "green",
  },
  {
    id: "7",
    title: "Workshop A",
    description: "Training workshop",
    startDate: "2025-12-10",
    endDate: "2025-12-10",
    startTime: "14:00",
    endTime: "16:00",
    color: "purple",
  },
  {
    id: "8",
    title: "Workshop B",
    description: "Technical workshop",
    startDate: "2025-12-10",
    endDate: "2025-12-10",
    startTime: "14:30",
    endTime: "16:30",
    color: "purple",
  },
  {
    id: "9",
    title: "Workshop C",
    description: "Design workshop",
    startDate: "2025-12-10",
    endDate: "2025-12-10",
    startTime: "15:00",
    endTime: "17:00",
    color: "red",
  },
  {
    id: "10",
    title: "Product Development",
    description: "Sprint review",
    startDate: "2025-12-12",
    endDate: "2025-12-12",
    startTime: "01:00",
    endTime: "05:00",
    color: "purple",
  },
  {
    id: "11",
    title: "Investor Presentation",
    description: "Q4 investor meeting",
    startDate: "2025-12-15",
    endDate: "2025-12-15",
    startTime: "06:30",
    endTime: "08:00",
    color: "yellow",
  },
  {
    id: "12",
    title: "Team Lunch",
    description: "Team building lunch",
    startDate: "2025-12-15",
    endDate: "2025-12-15",
    startTime: "12:00",
    endTime: "13:30",
    color: "green",
  },
  {
    id: "13",
    title: "Team Breakfast",
    description: "Morning team gathering",
    startDate: "2025-12-17",
    endDate: "2025-12-17",
    startTime: "07:00",
    endTime: "08:30",
    color: "green",
  },
  {
    id: "14",
    title: "Asia Market Review",
    description: "Market analysis meeting",
    startDate: "2025-12-19",
    endDate: "2025-12-19",
    startTime: "01:00",
    endTime: "03:00",
    color: "yellow",
  },
  {
    id: "15",
    title: "Strategy Planning",
    description: "2026 planning session",
    startDate: "2025-12-19",
    endDate: "2025-12-19",
    startTime: "09:00",
    endTime: "11:00",
    color: "blue",
  },
  {
    id: "16",
    title: "Budget Review",
    description: "Year-end budget analysis",
    startDate: "2025-12-19",
    endDate: "2025-12-19",
    startTime: "14:00",
    endTime: "16:00",
    color: "purple",
  },
  {
    id: "17",
    title: "Team Building",
    description: "Outdoor activities",
    startDate: "2025-12-19",
    endDate: "2025-12-19",
    startTime: "16:30",
    endTime: "18:00",
    color: "green",
  },
  {
    id: "18",
    title: "Q4 Wrap-up",
    description: "Quarterly summary",
    startDate: "2025-12-19",
    endDate: "2025-12-19",
    startTime: "18:30",
    endTime: "19:30",
    color: "red",
  },
  {
    id: "19",
    title: "Ads Campaign Nr2",
    description: "AdSense + FB, Target Audience: SMB2-Delta3",
    startDate: "2025-12-20",
    endDate: "2025-12-24",
    startTime: "00:00",
    endTime: "01:30",
    color: "yellow",
    isRecurring: true,
    recurrencePattern: "daily",
  },
  {
    id: "20",
    title: "Performance Review",
    description: "Annual review session",
    startDate: "2025-12-20",
    endDate: "2025-12-20",
    startTime: "10:00",
    endTime: "12:00",
    color: "blue",
  },
  {
    id: "21",
    title: "Holiday Party",
    description: "End of year celebration",
    startDate: "2025-12-20",
    endDate: "2025-12-20",
    startTime: "18:00",
    endTime: "22:00",
    color: "red",
  },
  {
    id: "22",
    title: "Project Deadline",
    description: "Final deliverables due",
    startDate: "2025-12-20",
    endDate: "2025-12-20",
    startTime: "17:00",
    endTime: "18:00",
    color: "purple",
  },
  {
    id: "23",
    title: "Meditation Session",
    description: "Wellness break",
    startDate: "2025-12-21",
    endDate: "2025-12-21",
    startTime: "02:00",
    endTime: "03:30",
    color: "blue",
  },
  {
    id: "24",
    title: "Code Review",
    description: "PR review session",
    startDate: "2025-12-21",
    endDate: "2025-12-21",
    startTime: "04:00",
    endTime: "05:30",
    color: "green",
  },
  {
    id: "25",
    title: "Breakfast Break",
    description: "Morning break",
    startDate: "2025-12-21",
    endDate: "2025-12-21",
    startTime: "06:30",
    endTime: "07:30",
    color: "yellow",
  },
  {
    id: "26",
    title: "Training Session",
    description: "New tools training",
    startDate: "2025-12-25",
    endDate: "2025-12-25",
    startTime: "14:00",
    endTime: "17:00",
    color: "green",
  },
  {
    id: "27",
    title: "Board Meeting",
    description: "Quarterly board review",
    startDate: "2025-12-28",
    endDate: "2025-12-28",
    startTime: "15:00",
    endTime: "17:00",
    color: "red",
  },
  {
    id: "28",
    title: "Year End Planning",
    description: "2026 roadmap discussion",
    startDate: "2025-12-28",
    endDate: "2025-12-28",
    startTime: "10:00",
    endTime: "12:00",
    color: "blue",
  },
  {
    id: "29",
    title: "Team Retrospective",
    description: "Sprint retrospective",
    startDate: "2025-12-28",
    endDate: "2025-12-28",
    startTime: "14:00",
    endTime: "15:00",
    color: "purple",
  },
];

const viewTransitionVariants = {
  initial: (direction: "forward" | "backward" | null) => ({
    opacity: 0,
    x: direction === "forward" ? 50 : direction === "backward" ? -50 : 0,
  }),
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: "forward" | "backward" | null) => ({
    opacity: 0,
    x: direction === "forward" ? -50 : direction === "backward" ? 50 : 0,
  }),
};

function CalendarContent() {
  const { viewMode, navigationDirection, isDarkMode, setIsDarkMode } = useCalendar();

  // Initialize dark mode on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const renderView = () => {
    switch (viewMode) {
      case "month":
        return <MonthView />;
      case "week":
        return <WeekView />;
      case "day":
        return <DayView />;
      case "list":
        return <ListView />;
      default:
        return <MonthView />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto p-6 gap-6">
      <CalendarHeader />

      <div className="flex-1 min-h-0 bg-card border border-border rounded-xl overflow-hidden">
        <AnimatePresence mode="wait" custom={navigationDirection}>
          <motion.div
            key={viewMode}
            custom={navigationDirection}
            variants={viewTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full p-4"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>

      <EventModal />
    </div>
  );
}

type CalendarProps = {
  initialEvents?: CalendarEvent[];
};

export function Calendar({ initialEvents }: CalendarProps = {}) {
  // Use sample events if no initial events provided
  const events = initialEvents || SAMPLE_EVENTS;

  return (
    <CalendarProvider initialEvents={events}>
      <CalendarContent />
    </CalendarProvider>
  );
}

export default Calendar;
