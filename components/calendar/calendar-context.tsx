"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameDay,
  isWithinInterval,
  parseISO,
} from "date-fns";
import {
  CalendarEvent,
  CalendarContextValue,
  ViewMode,
  EventColor,
  NewCalendarEvent,
  EventCalendarConfig,
  DEFAULT_CONFIG,
} from "./types";

const CalendarContext = createContext<CalendarContextValue | null>(null);

type CalendarProviderProps = {
  children: ReactNode;
  // Event data from parent
  events: CalendarEvent[];
  // Loading state
  isLoading?: boolean;
  // Event handlers
  onEventAdd: (event: NewCalendarEvent) => Promise<void>;
  onEventUpdate: (event: CalendarEvent) => Promise<void>;
  onEventDelete: (eventId: string) => Promise<void>;
  // Date range change handler
  onDateRangeChange?: (args: {
    startDate: Date;
    endDate: Date;
    signal?: AbortSignal;
  }) => Promise<void>;
  // Configuration
  config?: EventCalendarConfig;
};

export function CalendarProvider({
  children,
  events,
  isLoading = false,
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  onDateRangeChange,
  config: userConfig,
}: CalendarProviderProps) {
  // Merge config with defaults
  const config: Required<EventCalendarConfig> = {
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

  // Date state
  const [currentDate, setCurrentDateState] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [navigationDirection, setNavigationDirection] = useState<
    "forward" | "backward" | null
  >(null);

  // View state
  const [viewMode, setViewModeState] = useState<ViewMode>(config.defaultView);

  // Filtering
  const [activeFilters, setActiveFilters] = useState<EventColor[]>([
    "blue",
    "green",
    "yellow",
    "purple",
    "red",
  ]);

  // Settings
  const [use24Hour, setUse24Hour] = useState(config.use24HourFormatByDefault);
  const [isDarkMode, setIsDarkModeState] = useState(true);

  // Day view settings
  const [dayViewType, setDayViewType] = useState<"regular" | "resource">(
    config.dayView.viewType ?? "regular"
  );
  const [showDayTimeline, setShowDayTimeline] = useState(
    !config.dayView.hideTimeline
  );

  // Sync day view settings with config when it changes
  useEffect(() => {
    setDayViewType(config.dayView.viewType ?? "regular");
  }, [config.dayView.viewType]);

  useEffect(() => {
    setShowDayTimeline(!config.dayView.hideTimeline);
  }, [config.dayView.hideTimeline]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Abort controller for date range changes
  const abortControllerRef = useRef<AbortController | null>(null);

  // Dark mode effect
  const setIsDarkMode = useCallback((value: boolean) => {
    setIsDarkModeState(value);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", value);
    }
  }, []);

  // Initialize dark mode
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Calculate date range based on view and call onDateRangeChange
  const triggerDateRangeChange = useCallback(
    async (date: Date, view: ViewMode) => {
      if (!onDateRangeChange) return;

      // Abort previous request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      let startDate: Date;
      let endDate: Date;

      switch (view) {
        case "month":
          startDate = startOfWeek(startOfMonth(date), { weekStartsOn: config.weekStartsOn });
          endDate = endOfWeek(endOfMonth(date), { weekStartsOn: config.weekStartsOn });
          break;
        case "week":
          startDate = startOfWeek(date, { weekStartsOn: config.weekStartsOn });
          endDate = endOfWeek(date, { weekStartsOn: config.weekStartsOn });
          break;
        case "day":
          startDate = date;
          endDate = date;
          break;
        case "year":
          startDate = new Date(date.getFullYear(), 0, 1);
          endDate = new Date(date.getFullYear(), 11, 31);
          break;
        case "list":
          startDate = startOfMonth(date);
          endDate = endOfMonth(date);
          break;
        default:
          startDate = startOfMonth(date);
          endDate = endOfMonth(date);
      }

      try {
        await onDateRangeChange({
          startDate,
          endDate,
          signal: abortControllerRef.current.signal,
        });
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        throw err;
      }
    },
    [onDateRangeChange, config.weekStartsOn]
  );

  // Initial date range fetch
  useEffect(() => {
    triggerDateRangeChange(currentDate, viewMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set date with direction tracking
  const setCurrentDate = useCallback(
    (date: Date) => {
      setCurrentDateState(date);
    },
    []
  );

  // Set view mode and trigger date range change
  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setViewModeState(mode);
      setNavigationDirection(null);
      triggerDateRangeChange(currentDate, mode);
    },
    [currentDate, triggerDateRangeChange]
  );

  // Navigation functions
  const goToToday = useCallback(() => {
    const today = new Date();
    setNavigationDirection(null);
    setCurrentDateState(today);
    setSelectedDate(today);
    triggerDateRangeChange(today, viewMode);
  }, [viewMode, triggerDateRangeChange]);

  const goToNextPeriod = useCallback(() => {
    setNavigationDirection("forward");
    setCurrentDateState((prev) => {
      let newDate: Date;
      switch (viewMode) {
        case "month":
          newDate = addMonths(prev, 1);
          break;
        case "week":
          newDate = addWeeks(prev, 1);
          break;
        case "day":
          newDate = addDays(prev, 1);
          break;
        case "year":
          newDate = new Date(prev.getFullYear() + 1, prev.getMonth(), prev.getDate());
          break;
        case "list":
          newDate = addMonths(prev, 1);
          break;
        default:
          newDate = prev;
      }
      triggerDateRangeChange(newDate, viewMode);
      return newDate;
    });
  }, [viewMode, triggerDateRangeChange]);

  const goToPrevPeriod = useCallback(() => {
    setNavigationDirection("backward");
    setCurrentDateState((prev) => {
      let newDate: Date;
      switch (viewMode) {
        case "month":
          newDate = subMonths(prev, 1);
          break;
        case "week":
          newDate = subWeeks(prev, 1);
          break;
        case "day":
          newDate = subDays(prev, 1);
          break;
        case "year":
          newDate = new Date(prev.getFullYear() - 1, prev.getMonth(), prev.getDate());
          break;
        case "list":
          newDate = subMonths(prev, 1);
          break;
        default:
          newDate = prev;
      }
      triggerDateRangeChange(newDate, viewMode);
      return newDate;
    });
  }, [viewMode, triggerDateRangeChange]);

  const goToMonth = useCallback(
    (month: number) => {
      setNavigationDirection(null);
      setCurrentDateState((prev) => {
        const newDate = new Date(prev);
        newDate.setMonth(month);
        triggerDateRangeChange(newDate, viewMode);
        return newDate;
      });
    },
    [viewMode, triggerDateRangeChange]
  );

  const goToYear = useCallback(
    (year: number) => {
      setNavigationDirection(null);
      setCurrentDateState((prev) => {
        const newDate = new Date(prev);
        newDate.setFullYear(year);
        triggerDateRangeChange(newDate, viewMode);
        return newDate;
      });
    },
    [viewMode, triggerDateRangeChange]
  );

  // Event filtering
  const toggleFilter = useCallback((color: EventColor) => {
    setActiveFilters((prev) => {
      if (prev.includes(color)) {
        return prev.filter((c) => c !== color);
      }
      return [...prev, color];
    });
  }, []);

  // Get events for a specific date
  const getEventsForDate = useCallback(
    (date: Date): CalendarEvent[] => {
      return events.filter((event) => {
        if (!activeFilters.includes(event.color)) return false;

        const eventStart = parseISO(event.startDate);
        const eventEnd = parseISO(event.endDate);

        // Check if the date falls within the event range
        return (
          isSameDay(date, eventStart) ||
          isSameDay(date, eventEnd) ||
          isWithinInterval(date, { start: eventStart, end: eventEnd })
        );
      });
    },
    [events, activeFilters]
  );

  // Get events for a date range
  const getEventsForDateRange = useCallback(
    (start: Date, end: Date): CalendarEvent[] => {
      return events.filter((event) => {
        if (!activeFilters.includes(event.color)) return false;

        const eventStart = parseISO(event.startDate);
        const eventEnd = parseISO(event.endDate);

        // Check if there's any overlap
        return eventStart <= end && eventEnd >= start;
      });
    },
    [events, activeFilters]
  );

  // Event handlers that call external props
  const handleEventAdd = useCallback(
    async (event: NewCalendarEvent) => {
      setIsSubmitting(true);
      try {
        await onEventAdd(event);
        closeModal();
      } finally {
        setIsSubmitting(false);
      }
    },
    [onEventAdd]
  );

  const handleEventUpdate = useCallback(
    async (event: CalendarEvent) => {
      setIsSubmitting(true);
      try {
        await onEventUpdate(event);
        closeModal();
      } finally {
        setIsSubmitting(false);
      }
    },
    [onEventUpdate]
  );

  const handleEventDelete = useCallback(
    async (eventId: string) => {
      setIsSubmitting(true);
      try {
        await onEventDelete(eventId);
        closeModal();
      } finally {
        setIsSubmitting(false);
      }
    },
    [onEventDelete]
  );

  // Modal functions
  const openAddModal = useCallback((date?: Date) => {
    setEditingEvent(null);
    setModalInitialDate(date || new Date());
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setModalInitialDate(null);
  }, []);

  const value: CalendarContextValue = {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    goToToday,
    goToNextPeriod,
    goToPrevPeriod,
    goToMonth,
    goToYear,
    viewMode,
    setViewMode,
    events,
    getEventsForDate,
    getEventsForDateRange,
    handleEventAdd,
    handleEventUpdate,
    handleEventDelete,
    isLoading,
    isSubmitting,
    activeFilters,
    setActiveFilters,
    toggleFilter,
    use24Hour,
    setUse24Hour,
    isDarkMode,
    setIsDarkMode,
    dayViewType,
    setDayViewType,
    showDayTimeline,
    setShowDayTimeline,
    isModalOpen,
    setIsModalOpen,
    editingEvent,
    setEditingEvent,
    openAddModal,
    openEditModal,
    closeModal,
    navigationDirection,
    searchQuery,
    setSearchQuery,
    config,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
}
