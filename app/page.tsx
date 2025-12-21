"use client";

import { useState } from "react";
import { EventCalendar, useEventCalendar, CalendarEvent, NewCalendarEvent } from "@/components/calendar";
import type { MonthViewConfig, WeekViewConfig, DayViewConfig, YearViewConfig } from "@/components/calendar/types";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sample events for demo
const SAMPLE_EVENTS: CalendarEvent[] = [
  {
    id: "1",
    title: "Meeting A",
    description: "Team sync meeting",
    startDate: "2025-12-03",
    endDate: "2025-12-03",
    startTime: "10:00",
    endTime: "11:30",
    color: "blue",
  },
  {
    id: "2",
    title: "Meeting B",
    description: "Project planning",
    startDate: "2025-12-03",
    endDate: "2025-12-03",
    startTime: "10:00",
    endTime: "12:00",
    color: "blue",
  },
  {
    id: "3",
    title: "Meeting C",
    description: "Client call",
    startDate: "2025-12-03",
    endDate: "2025-12-03",
    startTime: "10:00",
    endTime: "13:00",
    color: "green",
  },
  {
    id: "4",
    title: "All-Day Project Sprint",
    description: "Sprint planning and execution",
    startDate: "2025-12-07",
    endDate: "2025-12-07",
    startTime: "00:00",
    endTime: "23:59",
    color: "red",
  },
  {
    id: "5",
    title: "International Client Call",
    description: "Quarterly review",
    startDate: "2025-12-09",
    endDate: "2025-12-09",
    startTime: "03:00",
    endTime: "04:00",
    color: "green",
  },
  {
    id: "6",
    title: "Team Standup",
    description: "Daily standup meeting",
    startDate: "2025-12-09",
    endDate: "2025-12-09",
    startTime: "05:30",
    endTime: "06:30",
    color: "green",
  },
  {
    id: "7",
    title: "Workshop A",
    description: "Training workshop",
    startDate: "2025-12-10",
    endDate: "2025-12-10",
    startTime: "14:00",
    endTime: "16:00",
    color: "purple",
  },
  {
    id: "8",
    title: "Workshop B",
    description: "Technical workshop",
    startDate: "2025-12-10",
    endDate: "2025-12-10",
    startTime: "14:30",
    endTime: "16:30",
    color: "purple",
  },
  {
    id: "9",
    title: "Workshop C",
    description: "Design workshop",
    startDate: "2025-12-10",
    endDate: "2025-12-10",
    startTime: "15:00",
    endTime: "17:00",
    color: "red",
  },
  {
    id: "10",
    title: "Product Development",
    description: "Sprint review",
    startDate: "2025-12-12",
    endDate: "2025-12-12",
    startTime: "01:00",
    endTime: "05:00",
    color: "purple",
  },
  {
    id: "11",
    title: "Investor Presentation",
    description: "Q4 investor meeting",
    startDate: "2025-12-15",
    endDate: "2025-12-15",
    startTime: "06:30",
    endTime: "08:00",
    color: "yellow",
  },
  {
    id: "12",
    title: "Team Lunch",
    description: "Team building lunch",
    startDate: "2025-12-15",
    endDate: "2025-12-15",
    startTime: "12:00",
    endTime: "13:30",
    color: "green",
  },
  {
    id: "13",
    title: "Team Breakfast",
    description: "Morning team gathering",
    startDate: "2025-12-17",
    endDate: "2025-12-17",
    startTime: "07:00",
    endTime: "08:30",
    color: "green",
  },
  {
    id: "14",
    title: "Asia Market Review",
    description: "Market analysis meeting",
    startDate: "2025-12-19",
    endDate: "2025-12-19",
    startTime: "01:00",
    endTime: "03:00",
    color: "yellow",
  },
  {
    id: "15",
    title: "Strategy Planning",
    description: "2026 planning session",
    startDate: "2025-12-19",
    endDate: "2025-12-19",
    startTime: "09:00",
    endTime: "11:00",
    color: "blue",
  },
  {
    id: "16",
    title: "Budget Review",
    description: "Year-end budget analysis",
    startDate: "2025-12-19",
    endDate: "2025-12-19",
    startTime: "14:00",
    endTime: "16:00",
    color: "purple",
  },
  {
    id: "17",
    title: "Team Building",
    description: "Outdoor activities",
    startDate: "2025-12-19",
    endDate: "2025-12-19",
    startTime: "16:30",
    endTime: "18:00",
    color: "green",
  },
  {
    id: "18",
    title: "Q4 Wrap-up",
    description: "Quarterly summary",
    startDate: "2025-12-19",
    endDate: "2025-12-19",
    startTime: "18:30",
    endTime: "19:30",
    color: "red",
  },
  {
    id: "19",
    title: "Ads Campaign Nr2",
    description: "AdSense + FB, Target Audience: SMB2-Delta3",
    startDate: "2025-12-20",
    endDate: "2025-12-24",
    startTime: "00:00",
    endTime: "01:30",
    color: "yellow",
    isRecurring: true,
    recurrencePattern: "daily",
  },
  {
    id: "20",
    title: "Performance Review",
    description: "Annual review session",
    startDate: "2025-12-20",
    endDate: "2025-12-20",
    startTime: "10:00",
    endTime: "12:00",
    color: "blue",
  },
  {
    id: "21",
    title: "Holiday Party",
    description: "End of year celebration",
    startDate: "2025-12-20",
    endDate: "2025-12-20",
    startTime: "18:00",
    endTime: "22:00",
    color: "red",
  },
  {
    id: "22",
    title: "Project Deadline",
    description: "Final deliverables due",
    startDate: "2025-12-20",
    endDate: "2025-12-20",
    startTime: "17:00",
    endTime: "18:00",
    color: "purple",
  },
  {
    id: "23",
    title: "Meditation Session",
    description: "Wellness break",
    startDate: "2025-12-21",
    endDate: "2025-12-21",
    startTime: "02:00",
    endTime: "03:30",
    color: "blue",
  },
  {
    id: "24",
    title: "Code Review",
    description: "PR review session",
    startDate: "2025-12-21",
    endDate: "2025-12-21",
    startTime: "04:00",
    endTime: "05:30",
    color: "green",
  },
  {
    id: "25",
    title: "Breakfast Break",
    description: "Morning break",
    startDate: "2025-12-21",
    endDate: "2025-12-21",
    startTime: "06:30",
    endTime: "07:30",
    color: "yellow",
  },
  {
    id: "26",
    title: "Training Session",
    description: "New tools training",
    startDate: "2025-12-25",
    endDate: "2025-12-25",
    startTime: "14:00",
    endTime: "17:00",
    color: "green",
  },
  {
    id: "27",
    title: "Board Meeting",
    description: "Quarterly board review",
    startDate: "2025-12-28",
    endDate: "2025-12-28",
    startTime: "15:00",
    endTime: "17:00",
    color: "red",
  },
  {
    id: "28",
    title: "Year End Planning",
    description: "2026 roadmap discussion",
    startDate: "2025-12-28",
    endDate: "2025-12-28",
    startTime: "10:00",
    endTime: "12:00",
    color: "blue",
  },
  {
    id: "29",
    title: "Team Retrospective",
    description: "Sprint retrospective",
    startDate: "2025-12-28",
    endDate: "2025-12-28",
    startTime: "14:00",
    endTime: "15:00",
    color: "purple",
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Latency options for the API simulation dropdown
const LATENCY_OPTIONS = [
  { label: "No delay", value: 0 },
  { label: "500ms", value: 500 },
  { label: "1 second", value: 1000 },
  { label: "2 seconds", value: 2000 },
  { label: "3 seconds", value: 3000 },
];

// Debounce options
const DEBOUNCE_OPTIONS = [
  { label: "No debounce", value: 0 },
  { label: "100ms", value: 100 },
  { label: "300ms", value: 300 },
  { label: "500ms", value: 500 },
];

// Language options
const LANGUAGE_OPTIONS = [
  { label: "English", value: "en" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Portuguese", value: "pt" },
];

export default function Home() {
  // Configuration state for Month View
  const [monthConfig, setMonthConfig] = useState<MonthViewConfig>({
    showOnlyCurrentMonth: true,
    viewType: "detailed",
    enableDoubleClickToShiftViewToWeekly: false,
    maxVisibleEvents: 2,
  });

  // Configuration state for Week View
  const [weekConfig, setWeekConfig] = useState<WeekViewConfig>({
    viewType: "regular",
    hideHoverLine: false,
    hideTimeline: false,
    enableDoubleClickToShiftViewToDaily: false,
  });

  // Configuration state for Day View
  const [dayConfig, setDayConfig] = useState<DayViewConfig>({
    viewType: "resource",
    hideHoverLine: false,
    hideTimeline: false,
    enableDoubleClickToAddEvent: false,
  });

  // Configuration state for Year View
  const [yearConfig, setYearConfig] = useState<YearViewConfig>({
    enableDoubleClickToShiftViewToMonthly: false,
  });

  // Demo/API simulation settings
  const [locale, setLocale] = useState("en");
  const [allowRetry, setAllowRetry] = useState(true);
  const [apiLatency, setApiLatency] = useState<number>(0);
  const [debounceTime, setDebounceTime] = useState<number>(0);

  // Use the hook for managing events with optimistic updates
  const {
    events,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    handleDateRangeChange,
  } = useEventCalendar({
    initialEvents: SAMPLE_EVENTS,

    // Called when a new event is created
    onEventAdd: async (event: NewCalendarEvent) => {
      // Simulate API call with configurable latency
      if (apiLatency > 0) {
        await delay(apiLatency);
      }

      // In a real app, you'd call your API here:
      // const response = await fetch('/api/events', {
      //   method: 'POST',
      //   body: JSON.stringify(event),
      // });
      // return response.json();

      // Return the created event with a new ID
      const createdEvent: CalendarEvent = {
        ...event,
        id: `event-${Date.now()}`,
      };
      return createdEvent;
    },

    // Called when an event is updated
    onEventUpdate: async (event: CalendarEvent) => {
      // Simulate API call with configurable latency
      if (apiLatency > 0) {
        await delay(apiLatency);
      }

      // In a real app:
      // await fetch(`/api/events/${event.id}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(event),
      // });

      return event;
    },

    // Called when an event is deleted
    onEventDelete: async (eventId: string) => {
      // Simulate API call with configurable latency
      if (apiLatency > 0) {
        await delay(apiLatency);
      }

      // In a real app:
      // await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
    },

    // Called when the visible date range changes (navigating months, etc.)
    onDateRangeChange: async ({ startDate, endDate, signal }) => {
      // Simulate API call with configurable latency
      if (apiLatency > 0) {
        await delay(apiLatency);
      }

      // In a real app, you'd fetch events from your API:
      // const response = await fetch(
      //   `/api/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
      //   { signal }
      // );
      // return response.json();

      // For demo, we just return the sample events
      // (filtering would happen on the server in a real app)
      return SAMPLE_EVENTS;
    },
  });

  return (
    <main className="min-h-screen bg-background">
      <EventCalendar
        events={events}
        isLoading={isLoading}
        onEventAdd={addEvent}
        onEventUpdate={updateEvent}
        onEventDelete={deleteEvent}
        onDateRangeChange={handleDateRangeChange}
        config={{
          defaultView: "month",
          use24HourFormatByDefault: true,
          weekStartsOn: 1,
          defaultEventColor: "blue",
          monthView: monthConfig,
          weekView: weekConfig,
          dayView: dayConfig,
          yearView: yearConfig,
        }}
      />

      {/* Configuration Panel */}
      <div className="max-w-[1400px] mx-auto px-6 pb-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Calendar Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Language & Localization */}
            <div className="bg-background/50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-foreground">
                Language &amp; Localization
              </h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Select Language
                  </label>
                  <Select value={locale} onValueChange={setLocale}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Month View */}
            <div className="bg-background/50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-foreground">Month View</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Show only current month
                  </span>
                  <Switch
                    checked={monthConfig.showOnlyCurrentMonth}
                    onCheckedChange={(checked) =>
                      setMonthConfig((prev) => ({
                        ...prev,
                        showOnlyCurrentMonth: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Double-click for weekly view
                  </span>
                  <Switch
                    checked={monthConfig.enableDoubleClickToShiftViewToWeekly}
                    onCheckedChange={(checked) =>
                      setMonthConfig((prev) => ({
                        ...prev,
                        enableDoubleClickToShiftViewToWeekly: checked,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    View Type
                  </label>
                  <Select
                    value={monthConfig.viewType}
                    onValueChange={(value: "basic" | "detailed") =>
                      setMonthConfig((prev) => ({ ...prev, viewType: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Week View */}
            <div className="bg-background/50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-foreground">Week View</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Show hover line
                  </span>
                  <Switch
                    checked={!weekConfig.hideHoverLine}
                    onCheckedChange={(checked) =>
                      setWeekConfig((prev) => ({
                        ...prev,
                        hideHoverLine: !checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Double-click for daily view
                  </span>
                  <Switch
                    checked={weekConfig.enableDoubleClickToShiftViewToDaily}
                    onCheckedChange={(checked) =>
                      setWeekConfig((prev) => ({
                        ...prev,
                        enableDoubleClickToShiftViewToDaily: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Show timeline
                  </span>
                  <Switch
                    checked={!weekConfig.hideTimeline}
                    onCheckedChange={(checked) =>
                      setWeekConfig((prev) => ({
                        ...prev,
                        hideTimeline: !checked,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    View Type
                  </label>
                  <Select
                    value={weekConfig.viewType}
                    onValueChange={(value: "regular" | "resource") =>
                      setWeekConfig((prev) => ({ ...prev, viewType: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Day View */}
            <div className="bg-background/50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-foreground">Day View</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Show hover line
                  </span>
                  <Switch
                    checked={!dayConfig.hideHoverLine}
                    onCheckedChange={(checked) =>
                      setDayConfig((prev) => ({
                        ...prev,
                        hideHoverLine: !checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Double-click to add event
                  </span>
                  <Switch
                    checked={dayConfig.enableDoubleClickToAddEvent}
                    onCheckedChange={(checked) =>
                      setDayConfig((prev) => ({
                        ...prev,
                        enableDoubleClickToAddEvent: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Show timeline
                  </span>
                  <Switch
                    checked={!dayConfig.hideTimeline}
                    onCheckedChange={(checked) =>
                      setDayConfig((prev) => ({
                        ...prev,
                        hideTimeline: !checked,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    View Type
                  </label>
                  <Select
                    value={dayConfig.viewType}
                    onValueChange={(value: "regular" | "resource") =>
                      setDayConfig((prev) => ({ ...prev, viewType: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Year View */}
            <div className="bg-background/50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-foreground">Year View</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Double-click for monthly view
                  </span>
                  <Switch
                    checked={yearConfig.enableDoubleClickToShiftViewToMonthly}
                    onCheckedChange={(checked) =>
                      setYearConfig((prev) => ({
                        ...prev,
                        enableDoubleClickToShiftViewToMonthly: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Event Settings */}
            <div className="bg-background/50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-foreground">Event Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Allow user retry after error
                  </span>
                  <Switch
                    checked={allowRetry}
                    onCheckedChange={setAllowRetry}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    API Latency Simulation
                  </label>
                  <Select
                    value={apiLatency.toString()}
                    onValueChange={(value) => setApiLatency(Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LATENCY_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Debounce Time
                  </label>
                  <Select
                    value={debounceTime.toString()}
                    onValueChange={(value) => setDebounceTime(Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEBOUNCE_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
