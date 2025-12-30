"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { CalendarProvider, useCalendar } from "./calendar-context";
import { CalendarHeader } from "./calendar-header";
import { MonthView, WeekView, DayView, YearView, ListView } from "./views";
import { EventModal } from "./event-modal";
import { CalendarSkeleton } from "./calendar-skeleton";
import { CalendarStoreProvider } from "./store";
import {
  EventCalendarConfig,
  EventCalendarProps,
  DEFAULT_CONFIG,
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
      case "year":
        return <YearView />;
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

// Helper to merge user config with defaults
function mergeConfig(
  userConfig?: EventCalendarConfig
): Required<EventCalendarConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    dayView: {
      ...DEFAULT_CONFIG.dayView,
      ...userConfig?.dayView,
    },
    weekView: {
      ...DEFAULT_CONFIG.weekView,
      ...userConfig?.weekView,
    },
    monthView: {
      ...DEFAULT_CONFIG.monthView,
      ...userConfig?.monthView,
    },
    yearView: {
      ...DEFAULT_CONFIG.yearView,
      ...userConfig?.yearView,
    },
  };
}

export function EventCalendar({
  events,
  isLoading = false,
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  onDateRangeChange,
  config: userConfig,
}: EventCalendarProps) {
  // Merge config with defaults
  const config = mergeConfig(userConfig);

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "dark:bg-card dark:text-foreground dark:border-border",
        }}
      />
      <CalendarStoreProvider config={config}>
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
      </CalendarStoreProvider>
    </>
  );
}

// Also export as Calendar for backwards compatibility
export const Calendar = EventCalendar;

export default EventCalendar;
