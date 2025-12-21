"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
  isSameDay,
} from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCalendar } from "../calendar-context";
import { EventCard } from "../event-card";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const eventVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

export function ListView() {
  const { currentDate, events, activeFilters } = useCalendar();
  const [searchQuery, setSearchQuery] = useState("");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const monthEvents = useMemo(() => {
    return events
      .filter((event) => {
        // Filter by color
        if (!activeFilters.includes(event.color)) return false;

        // Check if event overlaps with current month
        const eventStart = parseISO(event.startDate);
        const eventEnd = parseISO(event.endDate);

        const overlapsMonth =
          isWithinInterval(eventStart, { start: monthStart, end: monthEnd }) ||
          isWithinInterval(eventEnd, { start: monthStart, end: monthEnd }) ||
          (eventStart <= monthStart && eventEnd >= monthEnd);

        if (!overlapsMonth) return false;

        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            event.title.toLowerCase().includes(query) ||
            event.description?.toLowerCase().includes(query)
          );
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by start date, then by start time
        const dateCompare = a.startDate.localeCompare(b.startDate);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [events, activeFilters, monthStart, monthEnd, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border border-border rounded-lg mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-transparent border-0 focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Events List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={format(currentDate, "yyyy-MM")}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 space-y-3 overflow-y-auto"
        >
          {monthEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              No events this month
            </motion.div>
          ) : (
            monthEvents.map((event) => (
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
