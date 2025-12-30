"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  CalendarEvent,
  NewCalendarEvent,
  UseEventCalendarOptions,
  UseEventCalendarReturn,
} from "../types";

type UndoAction =
  | { type: "add"; event: CalendarEvent }
  | { type: "update"; previousEvent: CalendarEvent; newEvent: CalendarEvent }
  | { type: "delete"; event: CalendarEvent };

export function useEventCalendar({
  initialEvents = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  onDateRangeChange,
}: UseEventCalendarOptions = {}): UseEventCalendarReturn {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Abort controller for date range fetches
  const abortControllerRef = useRef<AbortController | null>(null);

  // Store last date range for refetch
  const lastDateRangeRef = useRef<{ startDate: Date; endDate: Date } | null>(null);

  // Undo stack
  const undoStackRef = useRef<UndoAction[]>([]);

  // Update events when initialEvents change
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const addEvent = useCallback(
    async (newEvent: NewCalendarEvent) => {
      // Generate optimistic ID
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticEvent: CalendarEvent = {
        ...newEvent,
        id: optimisticId,
      };

      // Optimistically add event
      setEvents((prev) => [...prev, optimisticEvent]);

      try {
        if (onEventAdd) {
          const createdEvent = await onEventAdd(newEvent);

          // Replace optimistic event with real one
          setEvents((prev) =>
            prev.map((e) => (e.id === optimisticId ? createdEvent : e))
          );

          // Add to undo stack
          undoStackRef.current.push({ type: "add", event: createdEvent });

          toast.success("Event created", {
            description: newEvent.title,
            action: {
              label: "Undo",
              onClick: () => handleUndo(),
            },
          });
        } else {
          // No handler provided, keep optimistic event
          toast.success("Event created", {
            description: newEvent.title,
          });
        }
      } catch (err) {
        // Rollback optimistic update
        setEvents((prev) => prev.filter((e) => e.id !== optimisticId));

        const errorMessage = err instanceof Error ? err.message : "Failed to create event";
        setError(err instanceof Error ? err : new Error(errorMessage));

        toast.error("Failed to create event", {
          description: errorMessage,
          action: {
            label: "Retry",
            onClick: () => addEvent(newEvent),
          },
        });

        throw err;
      }
    },
    [onEventAdd]
  );

  const updateEvent = useCallback(
    async (updatedEvent: CalendarEvent) => {
      // Find the previous event for undo
      const previousEvent = events.find((e) => e.id === updatedEvent.id);
      if (!previousEvent) {
        throw new Error("Event not found");
      }

      // Optimistically update event
      setEvents((prev) =>
        prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
      );

      try {
        if (onEventUpdate) {
          const result = await onEventUpdate(updatedEvent);

          // Update with server response
          setEvents((prev) =>
            prev.map((e) => (e.id === updatedEvent.id ? result : e))
          );

          // Add to undo stack
          undoStackRef.current.push({
            type: "update",
            previousEvent,
            newEvent: result,
          });

          toast.success("Event updated", {
            description: updatedEvent.title,
            action: {
              label: "Undo",
              onClick: () => handleUndo(),
            },
          });
        } else {
          toast.success("Event updated", {
            description: updatedEvent.title,
          });
        }
      } catch (err) {
        // Rollback optimistic update
        setEvents((prev) =>
          prev.map((e) => (e.id === updatedEvent.id ? previousEvent : e))
        );

        const errorMessage = err instanceof Error ? err.message : "Failed to update event";
        setError(err instanceof Error ? err : new Error(errorMessage));

        toast.error("Failed to update event", {
          description: errorMessage,
          action: {
            label: "Retry",
            onClick: () => updateEvent(updatedEvent),
          },
        });

        throw err;
      }
    },
    [events, onEventUpdate]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      // Find the event for undo
      const eventToDelete = events.find((e) => e.id === eventId);
      if (!eventToDelete) {
        throw new Error("Event not found");
      }

      // Optimistically remove event
      setEvents((prev) => prev.filter((e) => e.id !== eventId));

      try {
        if (onEventDelete) {
          await onEventDelete(eventId);

          // Add to undo stack
          undoStackRef.current.push({ type: "delete", event: eventToDelete });

          toast.success("Event deleted", {
            description: eventToDelete.title,
            action: {
              label: "Undo",
              onClick: () => handleUndo(),
            },
          });
        } else {
          toast.success("Event deleted", {
            description: eventToDelete.title,
          });
        }
      } catch (err) {
        // Rollback optimistic update
        setEvents((prev) => [...prev, eventToDelete]);

        const errorMessage = err instanceof Error ? err.message : "Failed to delete event";
        setError(err instanceof Error ? err : new Error(errorMessage));

        toast.error("Failed to delete event", {
          description: errorMessage,
          action: {
            label: "Retry",
            onClick: () => deleteEvent(eventId),
          },
        });

        throw err;
      }
    },
    [events, onEventDelete]
  );

  const handleDateRangeChange = useCallback(
    async ({
      startDate,
      endDate,
      signal,
    }: {
      startDate: Date;
      endDate: Date;
      signal?: AbortSignal;
    }) => {
      // Store for refetch
      lastDateRangeRef.current = { startDate, endDate };

      // Abort any in-flight request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const combinedSignal = signal || abortControllerRef.current.signal;

      if (!onDateRangeChange) return;

      setIsLoading(true);
      setError(null);

      try {
        const fetchedEvents = await onDateRangeChange({
          startDate,
          endDate,
          signal: combinedSignal,
        });

        // Only update if not aborted
        if (!combinedSignal.aborted) {
          setEvents(fetchedEvents);
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : "Failed to fetch events";
        setError(err instanceof Error ? err : new Error(errorMessage));

        toast.error("Failed to load events", {
          description: errorMessage,
          action: {
            label: "Retry",
            onClick: () =>
              handleDateRangeChange({ startDate, endDate }),
          },
        });
      } finally {
        if (!combinedSignal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [onDateRangeChange]
  );

  const refetch = useCallback(async () => {
    if (lastDateRangeRef.current) {
      await handleDateRangeChange(lastDateRangeRef.current);
    }
  }, [handleDateRangeChange]);

  const handleUndo = useCallback(async () => {
    const lastAction = undoStackRef.current.pop();
    if (!lastAction) return;

    try {
      switch (lastAction.type) {
        case "add":
          // Undo add = delete
          if (onEventDelete) {
            await onEventDelete(lastAction.event.id);
          }
          setEvents((prev) => prev.filter((e) => e.id !== lastAction.event.id));
          toast.success("Undo successful", {
            description: `Removed "${lastAction.event.title}"`,
          });
          break;

        case "update":
          // Undo update = restore previous
          if (onEventUpdate) {
            await onEventUpdate(lastAction.previousEvent);
          }
          setEvents((prev) =>
            prev.map((e) =>
              e.id === lastAction.previousEvent.id ? lastAction.previousEvent : e
            )
          );
          toast.success("Undo successful", {
            description: `Restored "${lastAction.previousEvent.title}"`,
          });
          break;

        case "delete":
          // Undo delete = re-add
          if (onEventAdd) {
            const { id, ...eventWithoutId } = lastAction.event;
            const restored = await onEventAdd(eventWithoutId);
            setEvents((prev) => [...prev, restored]);
          } else {
            setEvents((prev) => [...prev, lastAction.event]);
          }
          toast.success("Undo successful", {
            description: `Restored "${lastAction.event.title}"`,
          });
          break;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to undo";
      toast.error("Undo failed", {
        description: errorMessage,
      });
      // Put the action back on the stack
      undoStackRef.current.push(lastAction);
    }
  }, [onEventAdd, onEventUpdate, onEventDelete]);

  return {
    events,
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    handleDateRangeChange,
    refetch,
  };
}

