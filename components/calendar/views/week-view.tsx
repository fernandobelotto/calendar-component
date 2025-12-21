"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  isSameDay,
  parseISO,
  isWithinInterval,
  getWeek,
  differenceInDays,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useCalendar } from "../calendar-context";
import { CalendarEvent, EVENT_COLORS } from "../types";

// Generate hours for the time grid
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
    },
  },
};

// Type for positioned events with overlap info
type PositionedEvent = {
  event: CalendarEvent;
  column: number;
  totalColumns: number;
};

// Calculate overlapping events and assign columns
function calculateEventPositions({
  events,
}: {
  events: CalendarEvent[];
}): PositionedEvent[] {
  if (events.length === 0) return [];

  // Sort events by start time, then by duration (longer events first)
  const sortedEvents = [...events].sort((a, b) => {
    const aStart = timeToMinutes({ time: a.startTime });
    const bStart = timeToMinutes({ time: b.startTime });
    if (aStart !== bStart) return aStart - bStart;
    
    const aDuration = timeToMinutes({ time: a.endTime }) - aStart;
    const bDuration = timeToMinutes({ time: b.endTime }) - bStart;
    return bDuration - aDuration;
  });

  const positioned: PositionedEvent[] = [];
  const columns: { end: number; events: CalendarEvent[] }[] = [];

  for (const event of sortedEvents) {
    const eventStart = timeToMinutes({ time: event.startTime });
    const eventEnd = timeToMinutes({ time: event.endTime });

    // Find a column where this event fits (no overlap)
    let columnIndex = columns.findIndex((col) => col.end <= eventStart);

    if (columnIndex === -1) {
      // Need a new column
      columnIndex = columns.length;
      columns.push({ end: eventEnd, events: [event] });
    } else {
      // Update existing column
      columns[columnIndex].end = eventEnd;
      columns[columnIndex].events.push(event);
    }

    positioned.push({
      event,
      column: columnIndex,
      totalColumns: 0, // Will be updated later
    });
  }

  // Now we need to calculate the total columns for each event based on overlapping groups
  // Group events that overlap with each other
  const groups: PositionedEvent[][] = [];
  
  for (const pos of positioned) {
    const eventStart = timeToMinutes({ time: pos.event.startTime });
    const eventEnd = timeToMinutes({ time: pos.event.endTime });
    
    // Find existing group that overlaps
    let foundGroup = false;
    for (const group of groups) {
      const groupOverlaps = group.some((p) => {
        const pStart = timeToMinutes({ time: p.event.startTime });
        const pEnd = timeToMinutes({ time: p.event.endTime });
        return eventStart < pEnd && eventEnd > pStart;
      });
      
      if (groupOverlaps) {
        group.push(pos);
        foundGroup = true;
        break;
      }
    }
    
    if (!foundGroup) {
      groups.push([pos]);
    }
  }

  // Merge overlapping groups
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        // Check if any event in group i overlaps with any in group j
        const groupIOverlapsJ = groups[i].some((pi) => {
          const piStart = timeToMinutes({ time: pi.event.startTime });
          const piEnd = timeToMinutes({ time: pi.event.endTime });
          return groups[j].some((pj) => {
            const pjStart = timeToMinutes({ time: pj.event.startTime });
            const pjEnd = timeToMinutes({ time: pj.event.endTime });
            return piStart < pjEnd && piEnd > pjStart;
          });
        });
        
        if (groupIOverlapsJ) {
          groups[i].push(...groups[j]);
          groups.splice(j, 1);
          merged = true;
          break;
        }
      }
      if (merged) break;
    }
  }

  // Update totalColumns for each positioned event based on its group
  for (const group of groups) {
    const maxColumn = Math.max(...group.map((p) => p.column)) + 1;
    for (const pos of group) {
      pos.totalColumns = maxColumn;
    }
  }

  return positioned;
}

// Convert time string to minutes
function timeToMinutes({ time }: { time: string }): number {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

// Get event style based on time
function getEventStyle({
  startTime,
  endTime,
}: {
  startTime: string;
  endTime: string;
}): { top: number; height: number } {
  const startMinutes = timeToMinutes({ time: startTime });
  const endMinutes = timeToMinutes({ time: endTime });
  const duration = endMinutes - startMinutes;

  // Each hour is 60px
  const top = (startMinutes / 60) * 60;
  const height = Math.max((duration / 60) * 60, 24); // Minimum height of 24px

  return { top, height };
}

export function WeekView() {
  const {
    currentDate,
    selectedDate,
    setSelectedDate,
    setCurrentDate,
    setViewMode,
    events,
    activeFilters,
    openAddModal,
    openEditModal,
    config,
    use24Hour,
  } = useCalendar();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoverInfo, setHoverInfo] = useState<{
    dayIndex: number;
    minutes: number;
  } | null>(null);
  const timeGridRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update current time every minute
  useEffect(() => {
    if (config.weekView?.hideTimeline) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [config.weekView?.hideTimeline]);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const scrollPosition = (now.getHours() - 1) * 60; // Scroll to 1 hour before current time
      scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []);

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, {
      weekStartsOn: config.weekStartsOn,
    });
    const weekEnd = endOfWeek(currentDate, {
      weekStartsOn: config.weekStartsOn,
    });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate, config.weekStartsOn]);

  const weekNumber = useMemo(() => {
    return getWeek(currentDate, { weekStartsOn: config.weekStartsOn });
  }, [currentDate, config.weekStartsOn]);

  // Get all-day events for the week
  const allDayEvents = useMemo(() => {
    const weekStart = weekDays[0];
    const weekEnd = weekDays[weekDays.length - 1];

    return events.filter((event) => {
      if (!activeFilters.includes(event.color)) return false;
      if (!event.isAllDay) return false;

      const eventStart = parseISO(event.startDate);
      const eventEnd = parseISO(event.endDate);

      // Check if event overlaps with this week
      return eventStart <= weekEnd && eventEnd >= weekStart;
    });
  }, [events, weekDays, activeFilters]);

  // Get timed events for a specific day
  const getTimedEventsForDay = useCallback(
    (day: Date): CalendarEvent[] => {
      return events.filter((event) => {
        if (!activeFilters.includes(event.color)) return false;
        if (event.isAllDay) return false;

        const eventStart = parseISO(event.startDate);
        const eventEnd = parseISO(event.endDate);

        return (
          isSameDay(day, eventStart) ||
          isSameDay(day, eventEnd) ||
          isWithinInterval(day, { start: eventStart, end: eventEnd })
        );
      });
    },
    [events, activeFilters]
  );

  // Calculate all-day event position
  const getAllDayEventStyle = useCallback(
    (event: CalendarEvent) => {
      const eventStart = parseISO(event.startDate);
      const eventEnd = parseISO(event.endDate);
      const weekStart = weekDays[0];
      const weekEnd = weekDays[weekDays.length - 1];

      // Clamp to week boundaries
      const displayStart = eventStart < weekStart ? weekStart : eventStart;
      const displayEnd = eventEnd > weekEnd ? weekEnd : eventEnd;

      // Calculate column start and span
      const startCol = weekDays.findIndex((d) => isSameDay(d, displayStart));
      const endCol = weekDays.findIndex((d) => isSameDay(d, displayEnd));

      const colStart = Math.max(0, startCol);
      const colSpan = Math.min(6, endCol) - colStart + 1;

      return {
        gridColumnStart: colStart + 2, // +2 because first column is week number
        gridColumnEnd: `span ${colSpan}`,
      };
    },
    [weekDays]
  );

  // Handle double click to shift to daily view
  const handleDayDoubleClick = useCallback(
    (day: Date) => {
      if (config.weekView?.enableDoubleClickToShiftViewToDaily) {
        setCurrentDate(day);
        setViewMode("day");
      } else {
        openAddModal(day);
      }
    },
    [
      config.weekView?.enableDoubleClickToShiftViewToDaily,
      setCurrentDate,
      setViewMode,
      openAddModal,
    ]
  );

  // Handle mouse move for hover line
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
      if (config.weekView?.hideHoverLine) return;

      const rect = timeGridRef.current?.getBoundingClientRect();
      if (!rect) return;

      const y = e.clientY - rect.top;
      const minutes = (y / (24 * 60)) * 24 * 60;
      setHoverInfo({
        dayIndex,
        minutes: Math.max(0, Math.min(minutes, 24 * 60 - 1)),
      });
    },
    [config.weekView?.hideHoverLine]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  // Handle double click to add event
  const handleGridDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const minutes = (y / (24 * 60)) * 24 * 60;
      const hours = Math.floor(minutes / 60);
      const mins = Math.round((minutes % 60) / 15) * 15;

      const clickedDate = new Date(day);
      clickedDate.setHours(hours, mins, 0, 0);

      openAddModal(clickedDate);
    },
    [openAddModal]
  );

  // Get current time position
  const getCurrentTimePosition = useCallback(() => {
    const now = currentTime;
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / (24 * 60)) * 100;
  }, [currentTime]);

  // Format hour based on 24h setting
  const formatHour = (hour: number) => {
    if (use24Hour) {
      return `${hour.toString().padStart(2, "0")}:00`;
    }
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour} ${period}`;
  };

  // Format current time for display
  const formatCurrentTime = () => {
    const hours = currentTime.getHours();
    const mins = currentTime.getMinutes();
    if (use24Hour) {
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    }
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${mins.toString().padStart(2, "0")} ${period}`;
  };

  // Check if current time indicator should show for this week
  const shouldShowTimeline = useMemo(() => {
    if (config.weekView?.hideTimeline) return false;
    return weekDays.some((day) => isToday(day));
  }, [config.weekView?.hideTimeline, weekDays]);

  // Get the day index for today (for timeline positioning)
  const todayIndex = useMemo(() => {
    return weekDays.findIndex((day) => isToday(day));
  }, [weekDays]);

  const timelinePosition = getCurrentTimePosition();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={format(currentDate, "yyyy-ww")}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col h-full"
      >
        {/* Full-Day Events Section */}
        <div className="border-b border-border">
          <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
            Full-Day Events ({allDayEvents.length})
          </div>
          {allDayEvents.length > 0 && (
            <div
              className="grid pb-2 px-2 gap-1"
              style={{
                gridTemplateColumns: `80px repeat(7, 1fr)`,
              }}
            >
              {/* Empty cell for week number column */}
              <div />
              {/* All-day events */}
              {allDayEvents.map((event) => {
                const colorConfig = EVENT_COLORS[event.color];
                const style = getAllDayEventStyle(event);
                return (
                  <motion.button
                    key={event.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium truncate text-left",
                      colorConfig.bg,
                      colorConfig.text
                    )}
                    style={style}
                    onClick={() => openEditModal(event)}
                  >
                    {event.title}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Week Grid Header */}
        <div
          className="grid border-b border-border"
          style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
        >
          {/* Week number */}
          <div className="px-2 py-3 text-xs text-muted-foreground flex items-center justify-center">
            Week {weekNumber}
          </div>
          {/* Day headers */}
          {weekDays.map((day, index) => {
            const isDayToday = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                onDoubleClick={() => handleDayDoubleClick(day)}
                className={cn(
                  "px-2 py-3 text-center border-l border-border transition-colors hover:bg-accent/50",
                  isSelected && "bg-accent/30"
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-lg font-semibold mt-1 w-8 h-8 flex items-center justify-center mx-auto",
                    isDayToday &&
                      "bg-primary text-primary-foreground rounded-full"
                  )}
                >
                  {format(day, "d")}
                </div>
              </button>
            );
          })}
        </div>

        {/* Time Grid */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          <div
            ref={timeGridRef}
            className="grid relative"
            style={{
              gridTemplateColumns: `80px repeat(7, 1fr)`,
              minHeight: `${24 * 60}px`,
            }}
          >
            {/* Time labels column */}
            <div className="relative">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-[60px] pr-2 text-right text-xs text-muted-foreground -mt-2 first:mt-0"
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIndex) => {
              const dayEvents = getTimedEventsForDay(day);
              const positionedEvents = calculateEventPositions({
                events: dayEvents,
              });
              const isDayToday = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className="relative border-l border-border"
                  onMouseMove={(e) => handleMouseMove(e, dayIndex)}
                  onMouseLeave={handleMouseLeave}
                  onDoubleClick={(e) => handleGridDoubleClick(e, day)}
                >
                  {/* Hour grid lines */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="h-[60px] border-b border-border/50"
                    />
                  ))}

                  {/* Events */}
                  <AnimatePresence mode="popLayout">
                    {positionedEvents.map(
                      ({ event, column, totalColumns }) => {
                        const { top, height } = getEventStyle({
                          startTime: event.startTime,
                          endTime: event.endTime,
                        });
                        const colorConfig = EVENT_COLORS[event.color];

                        // Calculate width and left position based on overlapping columns
                        const width = `calc((100% - 8px) / ${totalColumns})`;
                        const left = `calc(4px + (100% - 8px) * ${column} / ${totalColumns})`;

                        return (
                          <motion.button
                            key={event.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                              "absolute rounded px-1 py-0.5 text-left overflow-hidden z-10",
                              "hover:ring-2 hover:ring-primary/50 transition-shadow",
                              colorConfig.bg,
                              colorConfig.text
                            )}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              width,
                              left,
                            }}
                            onClick={() => openEditModal(event)}
                          >
                            <div className="text-xs font-medium truncate">
                              {event.title}
                            </div>
                            {height > 30 && (
                              <div className="text-[10px] opacity-80 truncate">
                                {event.startTime} - {event.endTime}
                              </div>
                            )}
                          </motion.button>
                        );
                      }
                    )}
                  </AnimatePresence>

                  {/* Current time indicator for today's column */}
                  {shouldShowTimeline && isDayToday && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${timelinePosition}%` }}
                    >
                      <div className="flex items-center">
                        <div className="absolute -left-[80px] w-[76px] text-right">
                          <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                            {formatCurrentTime()}
                          </span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-primary -ml-1" />
                        <div className="flex-1 h-0.5 bg-primary" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Hover line indicator - spans across all columns */}
            {!config.weekView?.hideHoverLine && hoverInfo !== null && (
              <div
                className="absolute pointer-events-none z-10"
                style={{
                  top: `${(hoverInfo.minutes / (24 * 60)) * 100}%`,
                  left: `calc(80px + (100% - 80px) * ${hoverInfo.dayIndex} / 7)`,
                  width: `calc((100% - 80px) / 7)`,
                }}
              >
                <div className="h-px bg-primary/50 border-dashed" />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
