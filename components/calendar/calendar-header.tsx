"use client";

import { useState, useMemo } from "react";
import { format, getMonth, getYear, setMonth, setYear } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Filter,
  CalendarDays,
  List,
  Columns,
  Grid3X3,
  Plus,
  Moon,
  Sun,
  Check,
  Search,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCalendar } from "./calendar-context";
import { EventColor, EVENT_COLORS, ViewMode } from "./types";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const VIEW_OPTIONS: { value: ViewMode; icon: React.ReactNode; label: string }[] = [
  { value: "list", icon: <List className="h-4 w-4" />, label: "List" },
  { value: "day", icon: <Columns className="h-4 w-4" />, label: "Day" },
  { value: "week", icon: <Columns className="h-4 w-4" />, label: "Week" },
  { value: "month", icon: <Grid3X3 className="h-4 w-4" />, label: "Month" },
  { value: "year", icon: <CalendarDays className="h-4 w-4" />, label: "Year" },
];

export function CalendarHeader() {
  const {
    currentDate,
    viewMode,
    setViewMode,
    goToNextPeriod,
    goToPrevPeriod,
    goToToday,
    goToMonth,
    goToYear,
    use24Hour,
    setUse24Hour,
    isDarkMode,
    setIsDarkMode,
    activeFilters,
    toggleFilter,
    openAddModal,
    dayViewType,
    setDayViewType,
    showDayTimeline,
    setShowDayTimeline,
  } = useCalendar();

  const [monthSearch, setMonthSearch] = useState("");
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentMonth = getMonth(currentDate);
  const currentYear = getYear(currentDate);

  const filteredMonths = useMemo(() => {
    if (!monthSearch) return MONTHS;
    return MONTHS.filter((month) =>
      month.toLowerCase().includes(monthSearch.toLowerCase())
    );
  }, [monthSearch]);

  const years = useMemo(() => {
    const range = 10;
    const startYear = currentYear - range;
    return Array.from({ length: range * 2 + 1 }, (_, i) => startYear + i);
  }, [currentYear]);

  const getViewLabel = () => {
    switch (viewMode) {
      case "day":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "year":
        return "This Year";
      case "list":
        return "This Month";
      default:
        return "This Month";
    }
  };

  const formatDayHeader = () => {
    if (viewMode === "day") {
      const dayName = format(currentDate, "EEE");
      const dayOrdinal = format(currentDate, "do");
      return { dayName, dayOrdinal };
    }
    return null;
  };

  const dayHeader = formatDayHeader();

  const isFiltering = activeFilters.length < 5;

  return (
    <div className="flex flex-col gap-4">
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Event Calendar</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="rounded-full"
        >
          {isDarkMode ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        {/* Left side - Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevPeriod}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Day name (only in day view) */}
          {dayHeader && (
            <div className="flex items-center gap-2 px-2">
              <span className="text-sm text-muted-foreground">
                {dayHeader.dayName}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-3 gap-1 font-medium"
                  >
                    {dayHeader.dayOrdinal}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-2" align="start">
                  {/* Day picker could go here */}
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Month Selector */}
          <Popover open={isMonthOpen} onOpenChange={setIsMonthOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 px-3 gap-2 min-w-[140px] justify-start"
              >
                <Calendar className="h-4 w-4" />
                {MONTHS[currentMonth]}
                <ChevronDown className="h-3 w-3 opacity-50 ml-auto" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <div className="p-2 border-b border-border">
                <div className="flex items-center gap-2 px-2 py-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={monthSearch}
                    onChange={(e) => setMonthSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <ScrollArea className="h-[280px]">
                <div className="p-1">
                  {filteredMonths.map((month) => {
                    const monthIndex = MONTHS.indexOf(month);
                    const isSelected = monthIndex === currentMonth;
                    return (
                      <button
                        key={month}
                        onClick={() => {
                          goToMonth(monthIndex);
                          setIsMonthOpen(false);
                          setMonthSearch("");
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        )}
                      >
                        {month}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Year Selector */}
          <Popover open={isYearOpen} onOpenChange={setIsYearOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 px-4 font-medium">
                {currentYear}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[120px] p-2" align="start">
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => goToYear(currentYear - 1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="py-2 text-center font-medium">{currentYear}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => goToYear(currentYear + 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextPeriod}
            className="h-9 w-9"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center gap-2">
          {/* 12h/24h Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUse24Hour(!use24Hour)}
            className={cn("h-9 gap-2 overflow-hidden", use24Hour && "bg-accent")}
          >
            <Clock className="h-4 w-4" />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={use24Hour ? "24h" : "12h"}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {use24Hour ? "24h" : "12h"}
              </motion.span>
            </AnimatePresence>
          </Button>

          {/* Filter */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn("h-9 gap-2", isFiltering && "bg-accent")}
              >
                <Filter className="h-4 w-4" />
                {isFiltering ? "Filtering" : "Filter"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-3" align="end">
              <h4 className="font-medium mb-3">Filter by Color</h4>
              <div className="space-y-2">
                {(Object.keys(EVENT_COLORS) as EventColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => toggleFilter(color)}
                    className="flex items-center gap-3 w-full py-1.5 px-1 rounded hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className={cn(
                        "w-4 h-4 flex items-center justify-center",
                        activeFilters.includes(color)
                          ? "text-foreground"
                          : "text-transparent"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <div
                      className={cn("w-4 h-4 rounded-full", EVENT_COLORS[color].dot)}
                    />
                    <span className="text-sm capitalize">{color}</span>
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3"
                onClick={() => setIsFilterOpen(false)}
              >
                Close
              </Button>
            </PopoverContent>
          </Popover>

          {/* Today Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="h-9 gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            {getViewLabel()}
          </Button>

          {/* Day View Settings (only visible in day view) */}
          {viewMode === "day" && (
            <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-4" align="end">
                <div className="space-y-4">
                  {/* Show Timeline Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Show Timeline</span>
                    <Switch
                      checked={showDayTimeline}
                      onCheckedChange={setShowDayTimeline}
                    />
                  </div>

                  {/* View Type Selector */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium">View Type</span>
                    <Select
                      value={dayViewType}
                      onValueChange={(value: "regular" | "resource") =>
                        setDayViewType(value)
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
              </PopoverContent>
            </Popover>
          )}

          {/* View Mode Toggle Group */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {VIEW_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={viewMode === option.value ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 px-3 gap-1.5",
                  viewMode === option.value && "bg-background shadow-sm"
                )}
                onClick={() => setViewMode(option.value)}
              >
                {option.icon}
                {viewMode === option.value && (
                  <span className="text-xs">{option.label}</span>
                )}
              </Button>
            ))}
          </div>

          {/* Add Event Button */}
          <Button
            onClick={() => openAddModal()}
            className="h-9 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>
    </div>
  );
}

