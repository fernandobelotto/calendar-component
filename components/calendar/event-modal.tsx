"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Clock,
  Repeat,
  CalendarPlus,
  Trash2,
  Loader2,
  Sun,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useCalendar } from "./calendar-context";
import {
  CalendarEvent,
  EventColor,
  EVENT_COLORS,
  TIME_PRESETS,
  RecurrencePattern,
  NewCalendarEvent,
} from "./types";

// Simple inline mini calendar for date picking
function MiniCalendar({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [viewDate, setViewDate] = useState(value);

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() || 7; // Monday = 1
    const days: (Date | null)[] = [];

    // Fill in empty days before the first of the month
    for (let i = 1; i < startDay; i++) {
      days.push(null);
    }

    // Fill in the days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [viewDate]);

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() =>
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(viewDate, "MMMM yyyy")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() =>
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="py-1 text-muted-foreground">
            {d}
          </div>
        ))}
        {daysInMonth.map((day, i) =>
          day ? (
            <button
              key={i}
              onClick={() => onChange(day)}
              className={cn(
                "py-1 rounded hover:bg-accent",
                day.toDateString() === value.toDateString() &&
                  "bg-primary text-primary-foreground"
              )}
            >
              {day.getDate()}
            </button>
          ) : (
            <div key={i} />
          )
        )}
      </div>
    </div>
  );
}

// Time picker with up/down buttons
function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (time: string) => void;
}) {
  const [hours, minutes] = value.split(":").map(Number);

  const adjustTime = (unit: "hours" | "minutes", delta: number) => {
    let newHours = hours;
    let newMinutes = minutes;

    if (unit === "hours") {
      newHours = (hours + delta + 24) % 24;
    } else {
      newMinutes = (minutes + delta + 60) % 60;
    }

    onChange(
      `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`
    );
  };

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
      <div className="flex items-center gap-1">
        <span className="text-lg font-medium w-12 text-center">{value}</span>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => adjustTime("hours", 1)}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => adjustTime("hours", -1)}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function EventModal() {
  const {
    isModalOpen,
    closeModal,
    editingEvent,
    handleEventAdd,
    handleEventUpdate,
    handleEventDelete,
    selectedDate,
    isSubmitting,
    config,
  } = useCalendar();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [color, setColor] = useState<EventColor>(config.defaultEventColor);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] =
    useState<RecurrencePattern>("weekly");
  const [isAllDay, setIsAllDay] = useState(false);

  // Time preset carousel
  const [presetIndex, setPresetIndex] = useState(0);

  const isEditing = !!editingEvent;

  // Reset form when modal opens/closes or editing event changes
  useEffect(() => {
    if (isModalOpen) {
      if (editingEvent) {
        setTitle(editingEvent.title);
        setDescription(editingEvent.description || "");
        setStartDate(parseISO(editingEvent.startDate));
        setEndDate(parseISO(editingEvent.endDate));
        setStartTime(editingEvent.startTime);
        setEndTime(editingEvent.endTime);
        setColor(editingEvent.color);
        setIsRecurring(editingEvent.isRecurring || false);
        setRecurrencePattern(editingEvent.recurrencePattern || "weekly");
        setIsAllDay(editingEvent.isAllDay || false);
      } else {
        const initialDate = selectedDate || new Date();
        setTitle("");
        setDescription("");
        setStartDate(initialDate);
        setEndDate(initialDate);
        setStartTime("09:00");
        setEndTime("10:00");
        setColor(config.defaultEventColor);
        setIsRecurring(false);
        setRecurrencePattern("weekly");
        setIsAllDay(false);
      }
    }
  }, [isModalOpen, editingEvent, selectedDate, config.defaultEventColor]);

  const handlePresetChange = (direction: "prev" | "next") => {
    const newIndex =
      direction === "next"
        ? (presetIndex + 1) % TIME_PRESETS.length
        : (presetIndex - 1 + TIME_PRESETS.length) % TIME_PRESETS.length;
    setPresetIndex(newIndex);
  };

  const applyPreset = (index: number) => {
    const preset = TIME_PRESETS[index];
    setStartTime(preset.startTime);
    setEndTime(preset.endTime);
  };

  const handleSubmit = async () => {
    if (!title.trim() || isSubmitting) return;

    const eventData: NewCalendarEvent = {
      title: title.trim(),
      description: description.trim() || undefined,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      startTime: isAllDay ? "00:00" : startTime,
      endTime: isAllDay ? "23:59" : endTime,
      color,
      isRecurring,
      recurrencePattern: isRecurring ? recurrencePattern : undefined,
      isAllDay,
    };

    try {
      if (isEditing && editingEvent) {
        await handleEventUpdate({
          ...eventData,
          id: editingEvent.id,
        });
      } else {
        await handleEventAdd(eventData);
      }
    } catch (err) {
      // Error is handled by the hook/context with toast
      console.error("Event operation failed:", err);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent || isSubmitting) return;

    try {
      await handleEventDelete(editingEvent.id);
    } catch (err) {
      // Error is handled by the hook/context with toast
      console.error("Delete failed:", err);
    }
  };

  // Get visible presets (3 at a time)
  const visiblePresets = useMemo(() => {
    const presets: typeof TIME_PRESETS = [];
    for (let i = 0; i < 3; i++) {
      presets.push(TIME_PRESETS[(presetIndex + i) % TIME_PRESETS.length]);
    }
    return presets;
  }, [presetIndex]);

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && !isSubmitting && closeModal()}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <CalendarPlus className="h-5 w-5" />
              <div>
                <DialogTitle>
                  {isEditing ? "Edit Event" : "Add Event"}
                </DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? "Update your event details."
                    : "Create a new event in your calendar."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Title</label>
              <Input
                placeholder="Event Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              />
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">All Day Event</span>
              </div>
              <Switch
                checked={isAllDay}
                onCheckedChange={setIsAllDay}
                disabled={isSubmitting}
              />
            </div>

            {/* Time Presets - hidden when all day */}
            {!isAllDay && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handlePresetChange("prev")}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 flex gap-2">
                  {visiblePresets.map((preset, i) => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => applyPreset((presetIndex + i) % TIME_PRESETS.length)}
                      disabled={isSubmitting}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handlePresetChange("next")}
                  disabled={isSubmitting}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Date & Time Row */}
            <div className={cn("grid gap-4", isAllDay ? "grid-cols-2" : "grid-cols-2")}>
              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isAllDay ? "Start Date" : "Date"}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "MMMM do, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <MiniCalendar
                      value={startDate}
                      onChange={(date) => {
                        setStartDate(date);
                        if (date > endDate) setEndDate(date);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Start Time - hidden when all day */}
              {!isAllDay && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time</label>
                  <TimePicker value={startTime} onChange={setStartTime} />
                </div>
              )}

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "MMMM do, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <MiniCalendar
                      value={endDate}
                      onChange={(date) => {
                        if (date >= startDate) setEndDate(date);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Time - hidden when all day */}
              {!isAllDay && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time</label>
                  <TimePicker value={endTime} onChange={setEndTime} />
                </div>
              )}
            </div>

            {/* Recurring Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Repeating Event?</span>
              </div>
              <Switch
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
                disabled={isSubmitting}
              />
            </div>

            {/* Recurrence Pattern */}
            <AnimatePresence>
              {isRecurring && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Select
                    value={recurrencePattern}
                    onValueChange={(v) =>
                      setRecurrencePattern(v as RecurrencePattern)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Color Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Color</label>
              <Select
                value={color}
                onValueChange={(v) => setColor(v as EventColor)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full",
                          EVENT_COLORS[color].dot
                        )}
                      />
                      <span className="capitalize">{color}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EVENT_COLORS) as EventColor[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full",
                            EVENT_COLORS[c].dot
                          )}
                        />
                        <span className="capitalize">{c}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </Button>
              )}
              <div className="flex-1" />
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim()}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
