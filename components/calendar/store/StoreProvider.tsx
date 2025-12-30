"use client";

import { ReactNode, useState } from "react";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "./store";
import { initializeCalendar } from "./calendarSlice";
import type { EventCalendarConfig } from "../types";

type CalendarStoreProviderProps = {
  children: ReactNode;
  config: Required<EventCalendarConfig>;
};

export function CalendarStoreProvider({
  children,
  config,
}: CalendarStoreProviderProps) {
  // Use useState with lazy initialization to create store once
  const [store] = useState<AppStore>(() => {
    const newStore = makeStore();
    newStore.dispatch(initializeCalendar({ config }));
    return newStore;
  });

  return <Provider store={store}>{children}</Provider>;
}

