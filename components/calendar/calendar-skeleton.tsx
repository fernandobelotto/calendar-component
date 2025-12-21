"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const shimmer = {
  initial: { backgroundPosition: "-200% 0" },
  animate: {
    backgroundPosition: "200% 0",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear" as const,
    },
  },
};

function SkeletonBox({ className }: { className?: string }) {
  return (
    <motion.div
      variants={shimmer}
      initial="initial"
      animate="animate"
      className={cn(
        "rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]",
        className
      )}
    />
  );
}

export function CalendarHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-8 w-40" />
        <SkeletonBox className="h-9 w-9 rounded-full" />
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        {/* Left side - Navigation */}
        <div className="flex items-center gap-1">
          <SkeletonBox className="h-9 w-9" />
          <SkeletonBox className="h-9 w-[140px]" />
          <SkeletonBox className="h-9 w-16" />
          <SkeletonBox className="h-9 w-9" />
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-9 w-16" />
          <SkeletonBox className="h-9 w-20" />
          <SkeletonBox className="h-9 w-28" />
          <SkeletonBox className="h-9 w-32" />
          <SkeletonBox className="h-9 w-28" />
        </div>
      </div>
    </div>
  );
}

export function MonthViewSkeleton() {
  const days = Array.from({ length: 35 }, (_, i) => i);

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
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {days.map((index) => (
          <div
            key={index}
            className="min-h-[120px] p-2 border-b border-r border-border"
          >
            {/* Day Number */}
            <div className="flex justify-start mb-2">
              <SkeletonBox className="w-7 h-7 rounded-full" />
            </div>

            {/* Event Skeletons */}
            <div className="space-y-1">
              {index % 3 === 0 && (
                <>
                  <SkeletonBox className="h-10 w-full rounded" />
                  <SkeletonBox className="h-10 w-full rounded" />
                </>
              )}
              {index % 3 === 1 && (
                <SkeletonBox className="h-10 w-full rounded" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeekViewSkeleton() {
  const days = Array.from({ length: 7 }, (_, i) => i);

  return (
    <div className="grid grid-cols-7 gap-2 h-full">
      {days.map((index) => (
        <div
          key={index}
          className="flex flex-col rounded-lg border border-border overflow-hidden"
        >
          {/* Day Header */}
          <div className="p-3 text-center border-b border-border">
            <SkeletonBox className="h-4 w-8 mx-auto mb-2" />
            <SkeletonBox className="h-6 w-6 mx-auto rounded-full" />
          </div>

          {/* Events */}
          <div className="flex-1 p-2 space-y-2">
            {index % 2 === 0 && (
              <>
                <SkeletonBox className="h-14 w-full rounded" />
                <SkeletonBox className="h-14 w-full rounded" />
              </>
            )}
            {index % 2 === 1 && (
              <SkeletonBox className="h-14 w-full rounded" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListViewSkeleton() {
  const items = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border border-border rounded-lg mb-4">
        <SkeletonBox className="h-10 w-full" />
      </div>

      {/* Events List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {items.map((index) => (
          <SkeletonBox key={index} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function DayViewSkeleton() {
  return <ListViewSkeleton />;
}

type CalendarSkeletonProps = {
  view?: "month" | "week" | "day" | "year" | "list";
};

export function CalendarSkeleton({ view = "month" }: CalendarSkeletonProps) {
  return (
    <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto p-6 gap-6">
      <CalendarHeaderSkeleton />

      <div className="flex-1 min-h-0 bg-card border border-border rounded-xl overflow-hidden p-4">
        {view === "month" && <MonthViewSkeleton />}
        {view === "week" && <WeekViewSkeleton />}
        {view === "day" && <DayViewSkeleton />}
        {view === "year" && <MonthViewSkeleton />}
        {view === "list" && <ListViewSkeleton />}
      </div>
    </div>
  );
}
