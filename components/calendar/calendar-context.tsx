"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
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
import { CalendarEvent, ViewMode, EventColor } from "./types";
import { useCalendarStorage } from "./use-calendar-storage";

type CalendarContextValue = {
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

  // Events
  events: CalendarEvent[];
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (eventId: string) => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForDateRange: (start: Date, end: Date) => CalendarEvent[];

  // Filtering
  activeFilters: EventColor[];
  setActiveFilters: (filters: EventColor[]) => void;
  toggleFilter: (color: EventColor) => void;

  // Settings
  use24Hour: boolean;
  setUse24Hour: (value: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;

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
};

const CalendarContext = createContext<CalendarContextValue | null>(null);

type CalendarProviderProps = {
  children: ReactNode;
  initialEvents?: CalendarEvent[];
};

export function CalendarProvider({
  children,
  initialEvents = [],
}: CalendarProviderProps) {
  // Date state
  const [currentDate, setCurrentDateState] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [navigationDirection, setNavigationDirection] = useState<
    "forward" | "backward" | null
  >(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Storage
  const { events, addEvent, updateEvent, deleteEvent, isLoaded } =
    useCalendarStorage({ initialEvents });

  // Filtering
  const [activeFilters, setActiveFilters] = useState<EventColor[]>([
    "blue",
    "green",
    "yellow",
    "purple",
    "red",
  ]);

  // Settings
  const [use24Hour, setUse24Hour] = useState(true);
  const [isDarkMode, setIsDarkModeState] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Dark mode effect
  const setIsDarkMode = useCallback((value: boolean) => {
    setIsDarkModeState(value);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", value);
    }
  }, []);

  // Set date with direction tracking
  const setCurrentDate = useCallback(
    (date: Date) => {
      setCurrentDateState(date);
    },
    []
  );

  // Navigation functions
  const goToToday = useCallback(() => {
    setNavigationDirection(null);
    setCurrentDateState(new Date());
    setSelectedDate(new Date());
  }, []);

  const goToNextPeriod = useCallback(() => {
    setNavigationDirection("forward");
    setCurrentDateState((prev) => {
      switch (viewMode) {
        case "month":
          return addMonths(prev, 1);
        case "week":
          return addWeeks(prev, 1);
        case "day":
          return addDays(prev, 1);
        case "list":
          return addMonths(prev, 1);
        default:
          return prev;
      }
    });
  }, [viewMode]);

  const goToPrevPeriod = useCallback(() => {
    setNavigationDirection("backward");
    setCurrentDateState((prev) => {
      switch (viewMode) {
        case "month":
          return subMonths(prev, 1);
        case "week":
          return subWeeks(prev, 1);
        case "day":
          return subDays(prev, 1);
        case "list":
          return subMonths(prev, 1);
        default:
          return prev;
      }
    });
  }, [viewMode]);

  const goToMonth = useCallback((month: number) => {
    setNavigationDirection(null);
    setCurrentDateState((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(month);
      return newDate;
    });
  }, []);

  const goToYear = useCallback((year: number) => {
    setNavigationDirection(null);
    setCurrentDateState((prev) => {
      const newDate = new Date(prev);
      newDate.setFullYear(year);
      return newDate;
    });
  }, []);

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
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForDateRange,
    activeFilters,
    setActiveFilters,
    toggleFilter,
    use24Hour,
    setUse24Hour,
    isDarkMode,
    setIsDarkMode,
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
