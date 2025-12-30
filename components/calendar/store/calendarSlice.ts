import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  ViewMode,
  EventColor,
  CalendarEvent,
  EventCalendarConfig,
} from "../types";

// State type for the calendar slice
type CalendarState = {
  // Navigation
  currentDate: string; // ISO string for serialization
  selectedDate: string | null;
  navigationDirection: "forward" | "backward" | null;

  // View
  viewMode: ViewMode;
  dayViewType: "regular" | "resource";
  showDayTimeline: boolean;

  // UI/Modal
  isModalOpen: boolean;
  editingEvent: CalendarEvent | null;
  modalInitialDate: string | null;
  searchQuery: string;
  isSubmitting: boolean;

  // Settings
  activeFilters: EventColor[];
  use24Hour: boolean;
  isDarkMode: boolean;
};

const initialState: CalendarState = {
  // Navigation
  currentDate: new Date().toISOString(),
  selectedDate: new Date().toISOString(),
  navigationDirection: null,

  // View
  viewMode: "month",
  dayViewType: "regular",
  showDayTimeline: true,

  // UI/Modal
  isModalOpen: false,
  editingEvent: null,
  modalInitialDate: null,
  searchQuery: "",
  isSubmitting: false,

  // Settings
  activeFilters: ["blue", "green", "yellow", "purple", "red"],
  use24Hour: false,
  isDarkMode: true,
};

// Payload types
type InitializeCalendarPayload = {
  config: Required<EventCalendarConfig>;
};

type OpenAddModalPayload = {
  date?: string;
};

const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    // Initialize from config
    initializeCalendar: (
      state,
      action: PayloadAction<InitializeCalendarPayload>
    ) => {
      const { config } = action.payload;
      state.viewMode = config.defaultView;
      state.use24Hour = config.use24HourFormatByDefault;
      state.dayViewType = config.dayView.viewType ?? "regular";
      state.showDayTimeline = !config.dayView.hideTimeline;
    },

    // Navigation actions
    setCurrentDate: (state, action: PayloadAction<string>) => {
      state.currentDate = action.payload;
    },

    setSelectedDate: (state, action: PayloadAction<string | null>) => {
      state.selectedDate = action.payload;
    },

    setNavigationDirection: (
      state,
      action: PayloadAction<"forward" | "backward" | null>
    ) => {
      state.navigationDirection = action.payload;
    },

    // View actions
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
      state.navigationDirection = null;
    },

    setDayViewType: (state, action: PayloadAction<"regular" | "resource">) => {
      state.dayViewType = action.payload;
    },

    setShowDayTimeline: (state, action: PayloadAction<boolean>) => {
      state.showDayTimeline = action.payload;
    },

    // Modal actions
    openAddModal: (state, action: PayloadAction<OpenAddModalPayload>) => {
      state.editingEvent = null;
      state.modalInitialDate = action.payload.date || new Date().toISOString();
      state.isModalOpen = true;
    },

    openEditModal: (state, action: PayloadAction<CalendarEvent>) => {
      state.editingEvent = action.payload;
      state.isModalOpen = true;
    },

    closeModal: (state) => {
      state.isModalOpen = false;
      state.editingEvent = null;
      state.modalInitialDate = null;
    },

    setIsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isModalOpen = action.payload;
    },

    setEditingEvent: (state, action: PayloadAction<CalendarEvent | null>) => {
      state.editingEvent = action.payload;
    },

    setIsSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },

    // Search actions
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    // Settings actions
    setActiveFilters: (state, action: PayloadAction<EventColor[]>) => {
      state.activeFilters = action.payload;
    },

    toggleFilter: (state, action: PayloadAction<EventColor>) => {
      const color = action.payload;
      if (state.activeFilters.includes(color)) {
        state.activeFilters = state.activeFilters.filter((c) => c !== color);
      } else {
        state.activeFilters.push(color);
      }
    },

    setUse24Hour: (state, action: PayloadAction<boolean>) => {
      state.use24Hour = action.payload;
    },

    setIsDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },

    // Combined navigation actions for convenience
    goToToday: (state) => {
      const today = new Date().toISOString();
      state.navigationDirection = null;
      state.currentDate = today;
      state.selectedDate = today;
    },

    navigateForward: (state, action: PayloadAction<string>) => {
      state.navigationDirection = "forward";
      state.currentDate = action.payload;
    },

    navigateBackward: (state, action: PayloadAction<string>) => {
      state.navigationDirection = "backward";
      state.currentDate = action.payload;
    },
  },
});

export const {
  initializeCalendar,
  setCurrentDate,
  setSelectedDate,
  setNavigationDirection,
  setViewMode,
  setDayViewType,
  setShowDayTimeline,
  openAddModal,
  openEditModal,
  closeModal,
  setIsModalOpen,
  setEditingEvent,
  setIsSubmitting,
  setSearchQuery,
  setActiveFilters,
  toggleFilter,
  setUse24Hour,
  setIsDarkMode,
  goToToday,
  navigateForward,
  navigateBackward,
} = calendarSlice.actions;

export default calendarSlice.reducer;
