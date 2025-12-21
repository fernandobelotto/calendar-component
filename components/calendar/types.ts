export type EventColor = "blue" | "green" | "yellow" | "purple" | "red";

export type ViewMode = "month" | "week" | "day" | "list";

export type RecurrencePattern = "daily" | "weekly" | "monthly";

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  color: EventColor;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
};

export type TimePreset = {
  label: string;
  startTime: string;
  endTime: string;
};

export const EVENT_COLORS: Record<EventColor, { bg: string; text: string; dot: string }> = {
  blue: {
    bg: "bg-blue-600",
    text: "text-white",
    dot: "bg-blue-600",
  },
  green: {
    bg: "bg-green-700",
    text: "text-white",
    dot: "bg-green-700",
  },
  yellow: {
    bg: "bg-yellow-700",
    text: "text-white",
    dot: "bg-yellow-600",
  },
  purple: {
    bg: "bg-purple-600",
    text: "text-white",
    dot: "bg-purple-600",
  },
  red: {
    bg: "bg-red-700",
    text: "text-white",
    dot: "bg-red-700",
  },
};

export const TIME_PRESETS: TimePreset[] = [
  { label: "Morning", startTime: "09:00", endTime: "10:00" },
  { label: "Lunch", startTime: "12:00", endTime: "13:00" },
  { label: "Early Afternoon", startTime: "14:00", endTime: "15:00" },
  { label: "Late Afternoon", startTime: "16:00", endTime: "17:00" },
  { label: "Evening", startTime: "18:00", endTime: "19:00" },
  { label: "Night", startTime: "20:00", endTime: "21:00" },
];
