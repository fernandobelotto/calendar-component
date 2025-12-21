"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarEvent } from "./types";

const STORAGE_KEY = "calendar-events";

type UseCalendarStorageArgs = {
  initialEvents?: CalendarEvent[];
};

export function useCalendarStorage({ initialEvents = [] }: UseCalendarStorageArgs = {}) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load events from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedEvents = JSON.parse(stored) as CalendarEvent[];
        setEvents(parsedEvents);
      }
    } catch (error) {
      console.error("Failed to load events from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      } catch (error) {
        console.error("Failed to save events to localStorage:", error);
      }
    }
  }, [events, isLoaded]);

  const addEvent = useCallback((event: CalendarEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const updateEvent = useCallback((updatedEvent: CalendarEvent) => {
    setEvents((prev) =>
      prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
    );
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
  }, []);

  return {
    events,
    setEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    isLoaded,
  };
}
