"use client";

import { motion } from "framer-motion";
import { format, parseISO, isSameDay } from "date-fns";
import { Calendar, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarEvent, EVENT_COLORS } from "./types";
import { useCalendar } from "./calendar-context";

type EventCardProps = {
  event: CalendarEvent;
  variant?: "compact" | "full" | "list";
  showDate?: boolean;
  onClick?: () => void;
};

export function EventCard({
  event,
  variant = "compact",
  showDate = false,
  onClick,
}: EventCardProps) {
  const { use24Hour, openEditModal } = useCalendar();
  const colorConfig = EVENT_COLORS[event.color];

  const formatTime = (time: string) => {
    if (use24Hour) return time;
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const isMultiDay = !isSameDay(startDate, endDate);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      openEditModal(event);
    }
  };

  if (variant === "compact") {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className={cn(
          "w-full text-left px-2 py-1 rounded text-xs truncate",
          colorConfig.bg,
          colorConfig.text
        )}
      >
        <div className="font-medium truncate">{event.title}</div>
        <div className="text-[10px] opacity-90">
          {formatTime(event.startTime)} - {formatTime(event.endTime)}
        </div>
      </motion.button>
    );
  }

  if (variant === "list") {
    return (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.005, x: 2 }}
        whileTap={{ scale: 0.995 }}
        onClick={handleClick}
        className={cn(
          "w-full text-left p-4 rounded-lg flex items-start justify-between gap-4",
          colorConfig.bg,
          colorConfig.text
        )}
      >
        <div className="flex-1 min-w-0">
          {showDate && (
            <div className="text-xs opacity-80 mb-1 flex items-center gap-2">
              {isMultiDay ? (
                <>
                  {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
                </>
              ) : (
                format(startDate, "MMM d")
              )}
            </div>
          )}
          <div className="font-semibold truncate">{event.title}</div>
          {event.description && (
            <div className="text-sm opacity-90 truncate mt-0.5">
              {event.description}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm whitespace-nowrap">
          {isMultiDay && <Calendar className="h-4 w-4" />}
          {isMultiDay && <ArrowLeftRight className="h-4 w-4" />}
          <span>
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </span>
        </div>
      </motion.button>
    );
  }

  // Full variant
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        "w-full text-left p-3 rounded-lg",
        colorConfig.bg,
        colorConfig.text
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {showDate && (
            <div className="text-xs opacity-80 mb-1">
              {isMultiDay
                ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`
                : format(startDate, "MMM d")}
            </div>
          )}
          <div className="font-semibold truncate">{event.title}</div>
          {event.description && (
            <div className="text-sm opacity-90 mt-1 line-clamp-2">
              {event.description}
            </div>
          )}
        </div>
        <div className="text-xs whitespace-nowrap">
          {formatTime(event.startTime)} - {formatTime(event.endTime)}
        </div>
      </div>
    </motion.button>
  );
}

type MoreEventsButtonProps = {
  count: number;
  onClick: () => void;
};

export function MoreEventsButton({ count, onClick }: MoreEventsButtonProps) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
    >
      +{count} more
    </button>
  );
}

