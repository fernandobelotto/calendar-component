"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useMemo,
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
} from "./types";
import {
  useAppDispatch,
  useAppSelector,
  setCurrentDate as setCurrentDateAction,
  setSelectedDate as setSelectedDateAction,
  setViewMode as setViewModeAction,
  setActiveFilters as setActiveFiltersAction,
  toggleFilter as toggleFilterAction,
  setUse24Hour as setUse24HourAction,
  setIsDarkMode as setIsDarkModeAction,
  setDayViewType as setDayViewTypeAction,
  setShowDayTimeline as setShowDayTimelineAction,
  setIsModalOpen as setIsModalOpenAction,
  setEditingEvent as setEditingEventAction,
  setIsSubmitting as setIsSubmittingAction,
  setSearchQuery as setSearchQueryAction,
  openAddModal as openAddModalAction,
  openEditModal as openEditModalAction,
  closeModal as closeModalAction,
  goToToday as goToTodayAction,
  navigateForward,
  navigateBackward,
  setNavigationDirection,
} from "./store";

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
  // Configuration (already merged)
  config: Required<EventCalendarConfig>;
};

export function CalendarProvider({
  children,
  events,
  isLoading = false,
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  onDateRangeChange,
  config,
}: CalendarProviderProps) {
  const dispatch = useAppDispatch();

  // Read state from Redux
  const currentDateISO = useAppSelector((state) => state.calendar.currentDate);
  const selectedDateISO = useAppSelector((state) => state.calendar.selectedDate);
  const navigationDirection = useAppSelector(
    (state) => state.calendar.navigationDirection
  );
  const viewMode = useAppSelector((state) => state.calendar.viewMode);
  const dayViewType = useAppSelector((state) => state.calendar.dayViewType);
  const showDayTimeline = useAppSelector(
    (state) => state.calendar.showDayTimeline
  );
  const isModalOpen = useAppSelector((state) => state.calendar.isModalOpen);
  const editingEvent = useAppSelector((state) => state.calendar.editingEvent);
  const isSubmitting = useAppSelector((state) => state.calendar.isSubmitting);
  const searchQuery = useAppSelector((state) => state.calendar.searchQuery);
  const activeFilters = useAppSelector((state) => state.calendar.activeFilters);
  const use24Hour = useAppSelector((state) => state.calendar.use24Hour);
  const isDarkMode = useAppSelector((state) => state.calendar.isDarkMode);

  // Memoize Date objects to prevent unnecessary re-renders
  const currentDate = useMemo(
    () => new Date(currentDateISO),
    [currentDateISO]
  );
  const selectedDate = useMemo(
    () => (selectedDateISO ? new Date(selectedDateISO) : null),
    [selectedDateISO]
  );

  // Abort controller for date range changes
  const abortControllerRef = useRef<AbortController | null>(null);

  // Dark mode effect - sync with DOM
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDarkMode);
    }
  }, [isDarkMode]);

  // Initialize dark mode on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Sync day view settings with config when it changes
  useEffect(() => {
    dispatch(setDayViewTypeAction(config.dayView.viewType ?? "regular"));
  }, [config.dayView.viewType, dispatch]);

  useEffect(() => {
    dispatch(setShowDayTimelineAction(!config.dayView.hideTimeline));
  }, [config.dayView.hideTimeline, dispatch]);

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
          startDate = startOfWeek(startOfMonth(date), {
            weekStartsOn: config.weekStartsOn,
          });
          endDate = endOfWeek(endOfMonth(date), {
            weekStartsOn: config.weekStartsOn,
          });
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

  // Set date
  const setCurrentDate = useCallback(
    (date: Date) => {
      dispatch(setCurrentDateAction(date.toISOString()));
    },
    [dispatch]
  );

  // Set selected date
  const setSelectedDate = useCallback(
    (date: Date | null) => {
      dispatch(setSelectedDateAction(date ? date.toISOString() : null));
    },
    [dispatch]
  );

  // Set view mode and trigger date range change
  const setViewMode = useCallback(
    (mode: ViewMode) => {
      dispatch(setViewModeAction(mode));
      triggerDateRangeChange(currentDate, mode);
    },
    [dispatch, currentDate, triggerDateRangeChange]
  );

  // Navigation functions
  const goToToday = useCallback(() => {
    const today = new Date();
    dispatch(goToTodayAction());
    triggerDateRangeChange(today, viewMode);
  }, [dispatch, viewMode, triggerDateRangeChange]);

  const goToNextPeriod = useCallback(() => {
    let newDate: Date;
    switch (viewMode) {
      case "month":
        newDate = addMonths(currentDate, 1);
        break;
      case "week":
        newDate = addWeeks(currentDate, 1);
        break;
      case "day":
        newDate = addDays(currentDate, 1);
        break;
      case "year":
        newDate = new Date(
          currentDate.getFullYear() + 1,
          currentDate.getMonth(),
          currentDate.getDate()
        );
        break;
      case "list":
        newDate = addMonths(currentDate, 1);
        break;
      default:
        newDate = currentDate;
    }
    dispatch(navigateForward(newDate.toISOString()));
    triggerDateRangeChange(newDate, viewMode);
  }, [dispatch, viewMode, currentDate, triggerDateRangeChange]);

  const goToPrevPeriod = useCallback(() => {
    let newDate: Date;
    switch (viewMode) {
      case "month":
        newDate = subMonths(currentDate, 1);
        break;
      case "week":
        newDate = subWeeks(currentDate, 1);
        break;
      case "day":
        newDate = subDays(currentDate, 1);
        break;
      case "year":
        newDate = new Date(
          currentDate.getFullYear() - 1,
          currentDate.getMonth(),
          currentDate.getDate()
        );
        break;
      case "list":
        newDate = subMonths(currentDate, 1);
        break;
      default:
        newDate = currentDate;
    }
    dispatch(navigateBackward(newDate.toISOString()));
    triggerDateRangeChange(newDate, viewMode);
  }, [dispatch, viewMode, currentDate, triggerDateRangeChange]);

  const goToMonth = useCallback(
    (month: number) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(month);
      dispatch(setNavigationDirection(null));
      dispatch(setCurrentDateAction(newDate.toISOString()));
      triggerDateRangeChange(newDate, viewMode);
    },
    [dispatch, currentDate, viewMode, triggerDateRangeChange]
  );

  const goToYear = useCallback(
    (year: number) => {
      const newDate = new Date(currentDate);
      newDate.setFullYear(year);
      dispatch(setNavigationDirection(null));
      dispatch(setCurrentDateAction(newDate.toISOString()));
      triggerDateRangeChange(newDate, viewMode);
    },
    [dispatch, currentDate, viewMode, triggerDateRangeChange]
  );

  // Event filtering
  const toggleFilter = useCallback(
    (color: EventColor) => {
      dispatch(toggleFilterAction(color));
    },
    [dispatch]
  );

  const setActiveFilters = useCallback(
    (filters: EventColor[]) => {
      dispatch(setActiveFiltersAction(filters));
    },
    [dispatch]
  );

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

  // Modal functions
  const openAddModal = useCallback(
    (date?: Date) => {
      dispatch(openAddModalAction({ date: date?.toISOString() }));
    },
    [dispatch]
  );

  const openEditModal = useCallback(
    (event: CalendarEvent) => {
      dispatch(openEditModalAction(event));
    },
    [dispatch]
  );

  const closeModal = useCallback(() => {
    dispatch(closeModalAction());
  }, [dispatch]);

  const setIsModalOpen = useCallback(
    (open: boolean) => {
      dispatch(setIsModalOpenAction(open));
    },
    [dispatch]
  );

  const setEditingEvent = useCallback(
    (event: CalendarEvent | null) => {
      dispatch(setEditingEventAction(event));
    },
    [dispatch]
  );

  // Event handlers that call external props
  const handleEventAdd = useCallback(
    async (event: NewCalendarEvent) => {
      dispatch(setIsSubmittingAction(true));
      try {
        await onEventAdd(event);
        closeModal();
      } finally {
        dispatch(setIsSubmittingAction(false));
      }
    },
    [dispatch, onEventAdd, closeModal]
  );

  const handleEventUpdate = useCallback(
    async (event: CalendarEvent) => {
      dispatch(setIsSubmittingAction(true));
      try {
        await onEventUpdate(event);
        closeModal();
      } finally {
        dispatch(setIsSubmittingAction(false));
      }
    },
    [dispatch, onEventUpdate, closeModal]
  );

  const handleEventDelete = useCallback(
    async (eventId: string) => {
      dispatch(setIsSubmittingAction(true));
      try {
        await onEventDelete(eventId);
        closeModal();
      } finally {
        dispatch(setIsSubmittingAction(false));
      }
    },
    [dispatch, onEventDelete, closeModal]
  );

  // Settings setters
  const setUse24Hour = useCallback(
    (value: boolean) => {
      dispatch(setUse24HourAction(value));
    },
    [dispatch]
  );

  const setIsDarkMode = useCallback(
    (value: boolean) => {
      dispatch(setIsDarkModeAction(value));
    },
    [dispatch]
  );

  const setDayViewType = useCallback(
    (type: "regular" | "resource") => {
      dispatch(setDayViewTypeAction(type));
    },
    [dispatch]
  );

  const setShowDayTimeline = useCallback(
    (show: boolean) => {
      dispatch(setShowDayTimelineAction(show));
    },
    [dispatch]
  );

  const setSearchQuery = useCallback(
    (query: string) => {
      dispatch(setSearchQueryAction(query));
    },
    [dispatch]
  );

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
