"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isSameDay, isWithinInterval, isToday } from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCalendar } from "../calendar-context";
import { EventCard } from "../event-card";
import { EVENT_COLORS, EventColor, CalendarEvent } from "../types";

// Generate hours for the day view
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Resource columns (colors)
const RESOURCE_COLORS: EventColor[] = ["blue", "green", "yellow", "purple", "red"];

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
  const {
    currentDate,
    events,
    activeFilters,
    searchQuery,
    openAddModal,
    openEditModal,
    use24Hour,
    config,
    dayViewType,
    showDayTimeline,
  } = useCalendar();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const timeGridRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for the timeline
  useEffect(() => {
    if (!showDayTimeline) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [showDayTimeline]);

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

  // Group events by color for resource view
  const eventsByColor = useMemo(() => {
    const grouped: Record<EventColor, CalendarEvent[]> = {
      blue: [],
      green: [],
      yellow: [],
      purple: [],
      red: [],
    };

    dayEvents.forEach((event) => {
      grouped[event.color].push(event);
    });

    return grouped;
  }, [dayEvents]);

  // Get event count for each color
  const getEventCount = useCallback(
    (color: EventColor) => {
      return eventsByColor[color].length;
    },
    [eventsByColor]
  );

  // Calculate event position and height based on time
  const getEventStyle = useCallback(
    (startTime: string, endTime: string) => {
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const duration = endMinutes - startMinutes;

      // Each hour is 60px
      const top = (startMinutes / 60) * 60;
      const height = Math.max((duration / 60) * 60, 20); // Minimum height of 20px

      return { top, height };
    },
    []
  );

  // Handle mouse move for hover line
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (config.dayView?.hideHoverLine) return;

      const rect = timeGridRef.current?.getBoundingClientRect();
      if (!rect) return;

      const y = e.clientY - rect.top;
      const minutes = (y / rect.height) * 24 * 60;
      setHoverTime(Math.max(0, Math.min(minutes, 24 * 60 - 1)));
    },
    [config.dayView?.hideHoverLine]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null);
  }, []);

  // Handle double click to add event
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!config.dayView?.enableDoubleClickToAddEvent) return;

      const rect = timeGridRef.current?.getBoundingClientRect();
      if (!rect) return;

      const y = e.clientY - rect.top;
      const minutes = (y / rect.height) * 24 * 60;
      const hours = Math.floor(minutes / 60);
      const mins = Math.round((minutes % 60) / 15) * 15; // Round to nearest 15 min

      const clickedDate = new Date(currentDate);
      clickedDate.setHours(hours, mins, 0, 0);

      openAddModal(clickedDate);
    },
    [config.dayView?.enableDoubleClickToAddEvent, currentDate, openAddModal]
  );

  // Format time based on 24h setting
  const formatHour = (hour: number) => {
    if (use24Hour) {
      return `${hour.toString().padStart(2, "0")}:00`;
    }
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour} ${period}`;
  };

  // Calculate timeline position
  const getTimelinePosition = useCallback(() => {
    if (!isToday(currentDate)) return null;

    const now = currentTime;
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / (24 * 60)) * 100;
  }, [currentDate, currentTime]);

  const timelinePosition = getTimelinePosition();

  // Format hover time
  const formatHoverTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (use24Hour) {
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    }
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${mins.toString().padStart(2, "0")} ${period}`;
  };

  // Resource View
  if (dayViewType === "resource") {
    return (
      <div className="flex flex-col h-full">
        {/* Resource Header */}
        <div className="flex border-b border-border">
          {/* Time column header */}
          <div className="w-16 flex-shrink-0" />
          {/* Resource columns */}
          {RESOURCE_COLORS.map((color) => {
            const colorClasses = EVENT_COLORS[color];
            const count = getEventCount(color);
            return (
              <div
                key={color}
                className="flex-1 px-2 py-3 text-center border-l border-border"
              >
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={cn("w-3 h-3 rounded-full", colorClasses.dot)}
                  />
                  <span className="text-sm font-medium capitalize">
                    {color}
                    {count > 0 && (
                      <span className="text-muted-foreground ml-1">({count})</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* All Day Row */}
        <div className="flex border-b border-border min-h-[40px]">
          <div className="w-16 flex-shrink-0 text-xs text-muted-foreground pr-2 text-right py-2">
            All Day
          </div>
          {RESOURCE_COLORS.map((color) => (
            <div
              key={color}
              className="flex-1 border-l border-border p-1"
            >
              {/* All day events would go here */}
            </div>
          ))}
        </div>

        {/* Time Grid with Resource Columns */}
        <div className="flex-1 overflow-y-auto">
          <div
            ref={timeGridRef}
            className="relative min-h-[1440px]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Hour rows */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="flex border-b border-border h-[60px]"
              >
                <div className="w-16 flex-shrink-0 text-xs text-muted-foreground pr-2 text-right pt-0 -mt-2">
                  {formatHour(hour)}
                </div>
                {RESOURCE_COLORS.map((color) => (
                  <div
                    key={color}
                    className="flex-1 border-l border-border relative"
                  />
                ))}
              </div>
            ))}

            {/* Current time indicator (timeline) */}
            {showDayTimeline && timelinePosition !== null && (
              <div
                className="absolute left-16 right-0 z-20 pointer-events-none"
                style={{ top: `${timelinePosition}%` }}
              >
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
                  <div className="flex-1 h-0.5 bg-red-500" />
                </div>
              </div>
            )}

            {/* Hover line indicator */}
            {!config.dayView?.hideHoverLine && hoverTime !== null && (
              <div
                className="absolute left-16 right-0 z-10 pointer-events-none flex items-center"
                style={{ top: `${(hoverTime / (24 * 60)) * 100}%` }}
              >
                <div className="absolute -left-14 text-xs text-muted-foreground bg-background px-1 rounded">
                  {formatHoverTime(hoverTime)}
                </div>
                <div className="flex-1 h-px bg-primary/50 border-dashed" />
              </div>
            )}

            {/* Events positioned in resource columns */}
            {RESOURCE_COLORS.map((color, colorIndex) => {
              const colorEvents = eventsByColor[color];
              const colorClasses = EVENT_COLORS[color];
              // Calculate column position - each column is (100% - 64px) / 5 width
              // Time column is 64px (w-16)
              const columnWidth = `calc((100% - 64px) / 5)`;
              const columnLeft = `calc(64px + (100% - 64px) * ${colorIndex} / 5)`;

              return (
                <AnimatePresence key={color} mode="popLayout">
                  {colorEvents.map((event) => {
                    const { top, height } = getEventStyle(
                      event.startTime,
                      event.endTime
                    );

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                          "absolute rounded-md px-2 py-1 cursor-pointer z-10 mx-1",
                          "hover:ring-2 hover:ring-primary/50 transition-shadow",
                          colorClasses.bg,
                          colorClasses.text
                        )}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: columnLeft,
                          width: `calc(${columnWidth} - 8px)`,
                        }}
                        onClick={() => openEditModal(event)}
                      >
                        <div className="text-xs font-medium truncate">
                          {event.title}
                        </div>
                        {height > 30 && (
                          <div className="text-xs opacity-80 truncate">
                            {event.startTime} - {event.endTime}
                          </div>
                        )}
                        {height > 50 && event.description && (
                          <div className="text-xs opacity-70 truncate mt-0.5">
                            {event.description}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Regular View
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

      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto">
        <div
          ref={timeGridRef}
          className="relative min-h-[1440px]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onDoubleClick={handleDoubleClick}
        >
          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex border-b border-border h-[60px]"
            >
              <div className="w-16 flex-shrink-0 text-xs text-muted-foreground pr-2 text-right pt-0 -mt-2">
                {formatHour(hour)}
              </div>
              <div className="flex-1 relative" />
            </div>
          ))}

          {/* Current time indicator (timeline) */}
          {showDayTimeline && timelinePosition !== null && (
            <div
              className="absolute left-16 right-0 z-20 pointer-events-none"
              style={{ top: `${timelinePosition}%` }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
                <div className="flex-1 h-0.5 bg-red-500" />
              </div>
            </div>
          )}

          {/* Hover line indicator */}
          {!config.dayView?.hideHoverLine && hoverTime !== null && (
            <div
              className="absolute left-16 right-0 z-10 pointer-events-none flex items-center"
              style={{ top: `${(hoverTime / (24 * 60)) * 100}%` }}
            >
              <div className="absolute -left-14 text-xs text-muted-foreground bg-background px-1 rounded">
                {formatHoverTime(hoverTime)}
              </div>
              <div className="flex-1 h-px bg-primary/50 border-dashed" />
            </div>
          )}

          {/* Events */}
          <AnimatePresence mode="popLayout">
            {dayEvents.map((event) => {
              const { top, height } = getEventStyle(event.startTime, event.endTime);
              const colorClasses = EVENT_COLORS[event.color];

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "absolute left-20 right-4 rounded-md px-2 py-1 cursor-pointer z-10",
                    "hover:ring-2 hover:ring-primary/50 transition-shadow",
                    colorClasses.bg,
                    colorClasses.text
                  )}
                  style={{ top: `${top}px`, height: `${height}px` }}
                  onClick={() => openEditModal(event)}
                >
                  <div className="text-xs font-medium truncate">{event.title}</div>
                  {height > 30 && (
                    <div className="text-xs opacity-80 truncate">
                      {event.startTime} - {event.endTime}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

