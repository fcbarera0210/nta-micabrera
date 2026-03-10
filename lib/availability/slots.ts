/**
 * Pure helpers for slot generation and overlap validation.
 * No database access — all functions work with plain data.
 */

export interface TimeBlock {
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface TimeSlot extends TimeBlock {
  available: boolean;
}

/** Convert "HH:mm" to total minutes from midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Convert total minutes from midnight to "HH:mm". */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Returns true if intervals [a.start, a.end) and [b.start, b.end) overlap. */
export function intervalsOverlap(a: TimeBlock, b: TimeBlock): boolean {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Checks whether a new block overlaps any block in an existing list.
 * Returns the index of the first conflicting block, or -1 if no conflict.
 */
export function findOverlappingBlock(
  newBlock: TimeBlock,
  existing: TimeBlock[],
  skipIndex?: number
): number {
  for (let i = 0; i < existing.length; i++) {
    if (i === skipIndex) continue;
    if (intervalsOverlap(newBlock, existing[i])) return i;
  }
  return -1;
}

/**
 * Divides a list of availability blocks into consecutive slots of
 * `durationMinutes`, then marks each as available/unavailable based
 * on existing reservations for that date.
 */
export function generateSlots(
  blocks: TimeBlock[],
  durationMinutes: number,
  existingReservations: TimeBlock[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (const block of blocks) {
    let current = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);

    while (current + durationMinutes <= blockEnd) {
      const slotStart = minutesToTime(current);
      const slotEnd = minutesToTime(current + durationMinutes);
      const candidate: TimeBlock = { startTime: slotStart, endTime: slotEnd };

      const available = !existingReservations.some((r) =>
        intervalsOverlap(candidate, r)
      );

      slots.push({ startTime: slotStart, endTime: slotEnd, available });
      current += durationMinutes;
    }
  }

  return slots;
}

/** Returns readable label: "10:00 – 10:30" */
export function formatSlotLabel(slot: TimeBlock): string {
  return `${slot.startTime} – ${slot.endTime}`;
}

/** Day-of-week labels matching the DB convention: 0 = Lunes … 6 = Domingo */
export const DAY_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

/** Returns the day-of-week index (0=Lunes … 6=Domingo) for a given Date. */
export function getDayOfWeek(date: Date): number {
  const jsDay = date.getDay(); // 0=Sunday … 6=Saturday
  return jsDay === 0 ? 6 : jsDay - 1;
}
