"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  addMonths,
  subMonths,
  getDay,
  getDaysInMonth,
  isSameDay,
  isSameMonth,
  isToday,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminCalendarProps {
  selected?: Date;
  onSelect: (date: Date) => void;
  disabled?: (date: Date) => boolean;
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const slideVariants = {
  enter: (dir: "left" | "right") => ({
    x: dir === "left" ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: "left" | "right") => ({
    x: dir === "left" ? -40 : 40,
    opacity: 0,
  }),
};

export function AdminCalendar({
  selected,
  onSelect,
  disabled,
}: AdminCalendarProps) {
  const today = startOfDay(new Date());
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selected ?? today)
  );
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");

  function goToPrev() {
    setSlideDir("right");
    setViewMonth((m) => subMonths(m, 1));
  }

  function goToNext() {
    setSlideDir("left");
    setViewMonth((m) => addMonths(m, 1));
  }

  function goToToday() {
    const currentMonth = startOfMonth(today);
    setSlideDir(currentMonth < viewMonth ? "right" : "left");
    setViewMonth(currentMonth);
  }

  // Day-of-week offset: JS getDay() → 0=Sun, need 0=Mon
  const firstDay = startOfMonth(viewMonth);
  const jsFirstDay = getDay(firstDay); // 0=Sun...6=Sat
  const offset = jsFirstDay === 0 ? 6 : jsFirstDay - 1; // convert to Mon-first
  const daysInMonth = getDaysInMonth(viewMonth);

  const monthKey = format(viewMonth, "yyyy-MM");

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goToPrev}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeftIcon className="size-5" />
        </button>

        <button
          type="button"
          onClick={goToToday}
          className="px-4 py-2 rounded-xl text-sm font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 transition-colors"
        >
          Hoy
        </button>

        <button
          type="button"
          onClick={goToNext}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRightIcon className="size-5" />
        </button>
      </div>

      {/* Month + days grid with animation */}
      <div className="overflow-hidden w-full">
        <AnimatePresence mode="wait" custom={slideDir}>
          <motion.div
            key={monthKey}
            custom={slideDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex flex-col items-center gap-4"
          >
            {/* Month label */}
            <h3 className="text-base font-serif font-bold text-purple-950">
              {format(viewMonth, "MMMM yyyy", { locale: es })
                .replace(/^\w/, (c) => c.toUpperCase())}
            </h3>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5 w-full max-w-xs">
              {/* Weekday headers */}
              {DAY_LABELS.map((d) => (
                <div
                  key={d}
                  className="aspect-square flex items-center justify-center text-[11px] font-bold text-slate-400"
                >
                  {d}
                </div>
              ))}

              {/* Empty cells for offset */}
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Day buttons */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(
                  viewMonth.getFullYear(),
                  viewMonth.getMonth(),
                  day
                );
                const isSelected = selected ? isSameDay(date, selected) : false;
                const isDisabled = disabled ? disabled(date) : false;
                const isTodayDate = isToday(date);

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onSelect(date)}
                    className={cn(
                      "aspect-square rounded-2xl flex items-center justify-center text-sm font-bold transition-all",
                      isSelected
                        ? "bg-purple-600 text-white shadow-lg scale-110"
                        : isTodayDate
                        ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                        : isDisabled
                        ? "text-slate-200 cursor-not-allowed"
                        : "text-slate-600 hover:bg-purple-50 hover:text-purple-700"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
