---
name: Calendar API Refactor
overview: Refactor the calendar component to use a props-based API with external event handlers, a `useEventCalendar` hook for state management with optimistic updates, loading states, and date range change support.
todos:
  - id: update-types
    content: Update types.ts with EventCalendarProps and EventCalendarConfigType interfaces
    status: completed
  - id: create-hook
    content: Create useEventCalendar hook with optimistic updates, error handling, toasts
    status: completed
    dependencies:
      - update-types
  - id: create-skeleton
    content: Create calendar-skeleton.tsx loading component
    status: completed
  - id: update-context
    content: Update calendar-context to accept external handlers via props
    status: completed
    dependencies:
      - update-types
  - id: update-calendar
    content: Update Calendar.tsx to use new props-based API
    status: completed
    dependencies:
      - update-context
      - create-skeleton
  - id: update-modal
    content: Update event-modal to call external handlers with loading states
    status: completed
    dependencies:
      - update-context
  - id: add-date-range
    content: Add onDateRangeChange calls when navigating months/views
    status: completed
    dependencies:
      - update-context
  - id: update-demo
    content: Update page.tsx with proper usage pattern using useEventCalendar
    status: completed
    dependencies:
      - create-hook
      - update-calendar
---

# Calendar API Refactor

## Overview

Refactor the existing calendar to expose a clean, props-based API where event operations are handled externally. This enables integration with any backend/API while providing optimistic updates, loading states, and undo functionality out of the box.

## New API Structure

```typescript
interface EventCalendarProps {
  config?: EventCalendarConfigType;
  events: CalendarEventType[];
  isLoading?: boolean;
  onEventAdd: (event: Omit<CalendarEventType, 'id'>) => Promise<void>;
  onEventUpdate: (event: CalendarEventType) => Promise<void>;
  onEventDelete: (eventId: string) => Promise<void>;
  onDateRangeChange?: (startDate: Date, endDate: Date, signal?: AbortSignal) => Promise<void>;
}
```



## Key Changes

1. **Props-based event handlers** - Move event CRUD from internal state to external handlers
2. **useEventCalendar hook** - Provide a hook with optimistic updates, error handling, and toast notifications
3. **Loading state** - Add skeleton UI while events are loading
4. **Config object** - Consolidate settings (defaultView, use24HourFormat, etc.) into a config prop
5. **Date range change** - Call handler when navigating to fetch new events with AbortController support

## Files to Update/Create

| File | Action | Purpose |

|------|--------|---------|

| `types.ts` | Update | Add EventCalendarProps, EventCalendarConfigType |

| `calendar-context.tsx` | Update | Accept props, remove internal storage |

| `hooks/useEventCalendar.ts` | Create | Hook with optimistic updates |

| `Calendar.tsx` | Update | Accept new props interface |

| `calendar-skeleton.tsx` | Create | Loading skeleton component |

| `page.tsx` | Update | Demo usage with hook |

## Implementation Steps

1. Update types with new interfaces (EventCalendarProps, EventCalendarConfigType)
2. Create the `useEventCalendar` hook with optimistic updates and toast support
3. Create loading skeleton component
4. Update CalendarProvider/context to accept external handlers via props
5. Update Calendar component to use new props interface
6. Update event modal to call external handlers
7. Add date range change calls on navigation