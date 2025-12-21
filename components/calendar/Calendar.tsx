"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { CalendarProvider, useCalendar } from "./calendar-context";
import { CalendarHeader } from "./calendar-header";
import { MonthView, WeekView, DayView, ListView } from "./views";
import { EventModal } from "./event-modal";
import { CalendarSkeleton } from "./calendar-skeleton";
import {
  CalendarEvent,
  NewCalendarEvent,
  EventCalendarConfig,
  EventCalendarProps,
} from "./types";

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
  const { viewMode, navigationDirection, isLoading } = useCalendar();

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

  // Show skeleton when loading
  if (isLoading) {
    return <CalendarSkeleton view={viewMode} />;
  }

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

export function EventCalendar({
  events,
  isLoading = false,
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  onDateRangeChange,
  config,
}: EventCalendarProps) {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "dark:bg-card dark:text-foreground dark:border-border",
        }}
      />
      <CalendarProvider
        events={events}
        isLoading={isLoading}
        onEventAdd={onEventAdd}
        onEventUpdate={onEventUpdate}
        onEventDelete={onEventDelete}
        onDateRangeChange={onDateRangeChange}
        config={config}
      >
        <CalendarContent />
      </CalendarProvider>
    </>
  );
}

// Also export as Calendar for backwards compatibility
export const Calendar = EventCalendar;

export default EventCalendar;
