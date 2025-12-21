"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isSameDay, isWithinInterval } from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCalendar } from "../calendar-context";
import { EventCard } from "../event-card";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const eventVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

export function DayView() {
  const { currentDate, events, activeFilters, searchQuery, setSearchQuery } =
    useCalendar();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const dayEvents = useMemo(() => {
    return events
      .filter((event) => {
        // Filter by color
        if (!activeFilters.includes(event.color)) return false;

        // Check if event occurs on this day
        const eventStart = parseISO(event.startDate);
        const eventEnd = parseISO(event.endDate);

        const isOnDay =
          isSameDay(currentDate, eventStart) ||
          isSameDay(currentDate, eventEnd) ||
          isWithinInterval(currentDate, { start: eventStart, end: eventEnd });

        if (!isOnDay) return false;

        // Filter by search query
        if (localSearch) {
          const query = localSearch.toLowerCase();
          return (
            event.title.toLowerCase().includes(query) ||
            event.description?.toLowerCase().includes(query)
          );
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by start time
        return a.startTime.localeCompare(b.startTime);
      });
  }, [events, currentDate, activeFilters, localSearch]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border border-border rounded-lg mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 bg-transparent border-0 focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Events List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={format(currentDate, "yyyy-MM-dd")}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 space-y-3 overflow-y-auto"
        >
          {dayEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              No events for this day
            </motion.div>
          ) : (
            dayEvents.map((event) => (
              <motion.div key={event.id} variants={eventVariants}>
                <EventCard event={event} variant="list" showDate />
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
