export type EventColor = "blue" | "green" | "yellow" | "purple" | "red";

export type ViewMode = "month" | "week" | "day" | "year" | "list";

export type CalendarViewType = "day" | "week" | "month" | "year";

export type RecurrencePattern = "daily" | "weekly" | "monthly";

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO date string "YYYY-MM-DD"
  endDate: string; // ISO date string "YYYY-MM-DD"
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  color: EventColor;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  isAllDay?: boolean;
};

// Type for creating a new event (without id)
export type NewCalendarEvent = Omit<CalendarEvent, "id">;

export type TimePreset = {
  label: string;
  startTime: string;
  endTime: string;
};

// Day view configuration
export type DayViewConfig = {
  // The type of day view to display
  viewType?: "regular" | "resource";
  // When true, hides the hover indicator line
  hideHoverLine?: boolean;
  // When true, hides the current time indicator line
  hideTimeline?: boolean;
  // When true, allows double-click to add event
  enableDoubleClickToAddEvent?: boolean;
};

// Week view configuration
export type WeekViewConfig = {
  // The type of week view to display
  viewType?: "regular" | "resource";
  // When true, hides the hover indicator line
  hideHoverLine?: boolean;
  // When true, hides the current time indicator line
  hideTimeline?: boolean;
  // When true, allows double-click to switch to day view
  enableDoubleClickToShiftViewToDaily?: boolean;
};

// Month view configuration
export type MonthViewConfig = {
  // When true, shows only days in current month
  showOnlyCurrentMonth?: boolean;
  // The type of month view ('basic' shows minimal info, 'detailed' shows more)
  viewType?: "basic" | "detailed";
  // When true, allows double-click to switch to week view
  enableDoubleClickToShiftViewToWeekly?: boolean;
  // Maximum events to show before "+N more" (custom option)
  maxVisibleEvents?: number;
};

// Year view configuration
export type YearViewConfig = {
  // When true, allows double-click to switch to month view
  enableDoubleClickToShiftViewToMonthly?: boolean;
};

// Configuration for the calendar
export type EventCalendarConfig = {
  // Default view when calendar loads
  defaultView?: ViewMode;
  // Use 24-hour time format by default
  use24HourFormatByDefault?: boolean;
  // Week starts on Monday (1) or Sunday (0) - custom option
  weekStartsOn?: 0 | 1;
  // Default color for new events - custom option
  defaultEventColor?: EventColor;
  // Day view settings
  dayView?: DayViewConfig;
  // Week view settings
  weekView?: WeekViewConfig;
  // Month view settings
  monthView?: MonthViewConfig;
  // Year view settings
  yearView?: YearViewConfig;
};

// Props for the EventCalendar component
export type EventCalendarProps = {
  // Calendar configuration
  config?: EventCalendarConfig;
  // Event data
  events: CalendarEvent[];
  // Loading state - shows skeleton when true
  isLoading?: boolean;
  // Event operation handlers
  onEventAdd: (event: NewCalendarEvent) => Promise<void>;
  onEventUpdate: (event: CalendarEvent) => Promise<void>;
  onEventDelete: (eventId: string) => Promise<void>;
  // Date range change handler - called when navigating
  onDateRangeChange?: (args: {
    startDate: Date;
    endDate: Date;
    signal?: AbortSignal;
  }) => Promise<void>;
};

// Internal context value type
export type CalendarContextValue = {
  // Date state
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;

  // Navigation
  goToToday: () => void;
  goToNextPeriod: () => void;
  goToPrevPeriod: () => void;
  goToMonth: (month: number) => void;
  goToYear: (year: number) => void;

  // View state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Events (from props)
  events: CalendarEvent[];
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForDateRange: (start: Date, end: Date) => CalendarEvent[];

  // Event operations (call external handlers)
  handleEventAdd: (event: NewCalendarEvent) => Promise<void>;
  handleEventUpdate: (event: CalendarEvent) => Promise<void>;
  handleEventDelete: (eventId: string) => Promise<void>;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;

  // Filtering
  activeFilters: EventColor[];
  setActiveFilters: (filters: EventColor[]) => void;
  toggleFilter: (color: EventColor) => void;

  // Settings
  use24Hour: boolean;
  setUse24Hour: (value: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;

  // Day view settings
  dayViewType: "regular" | "resource";
  setDayViewType: (type: "regular" | "resource") => void;
  showDayTimeline: boolean;
  setShowDayTimeline: (show: boolean) => void;

  // Modal state
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  editingEvent: CalendarEvent | null;
  setEditingEvent: (event: CalendarEvent | null) => void;
  openAddModal: (date?: Date) => void;
  openEditModal: (event: CalendarEvent) => void;
  closeModal: () => void;

  // Navigation direction for animations
  navigationDirection: "forward" | "backward" | null;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Config
  config: Required<EventCalendarConfig>;
};

// Hook return type for useEventCalendar
export type UseEventCalendarOptions = {
  initialEvents?: CalendarEvent[];
  onEventAdd?: (event: NewCalendarEvent) => Promise<CalendarEvent>;
  onEventUpdate?: (event: CalendarEvent) => Promise<CalendarEvent>;
  onEventDelete?: (eventId: string) => Promise<void>;
  onDateRangeChange?: (args: {
    startDate: Date;
    endDate: Date;
    signal?: AbortSignal;
  }) => Promise<CalendarEvent[]>;
};

export type UseEventCalendarReturn = {
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  addEvent: (event: NewCalendarEvent) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  handleDateRangeChange: (args: {
    startDate: Date;
    endDate: Date;
    signal?: AbortSignal;
  }) => Promise<void>;
  refetch: () => Promise<void>;
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

// Default configuration
export const DEFAULT_CONFIG: Required<EventCalendarConfig> = {
  defaultView: "month",
  use24HourFormatByDefault: false,
  weekStartsOn: 1,
  defaultEventColor: "blue",
  dayView: {
    viewType: "regular",
    hideHoverLine: false,
    hideTimeline: false,
    enableDoubleClickToAddEvent: true,
  },
  weekView: {
    viewType: "regular",
    hideHoverLine: false,
    hideTimeline: false,
    enableDoubleClickToShiftViewToDaily: true,
  },
  monthView: {
    showOnlyCurrentMonth: false,
    viewType: "detailed",
    enableDoubleClickToShiftViewToWeekly: true,
    maxVisibleEvents: 2,
  },
  yearView: {
    enableDoubleClickToShiftViewToMonthly: true,
  },
};
