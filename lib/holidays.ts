/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE RECORDING SERVICE — HOLIDAY RATE & RUSH BOOKING DETECTION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Per Terms of Use §3:
 *
 *   1.5× labor:  New Year's Day, Memorial Day, July 4th, Labor Day,
 *                Black Friday, New Year's Eve (after 12pm — applied to full day)
 *
 *   2× labor:    Thanksgiving, Christmas Eve, Christmas Day
 *
 *   Rush Fee:    Events booked with fewer than 2 full business days' notice
 *                (< 16 business hours). Applied as a 20% surcharge on quoted total.
 *
 * No external dependencies — pure Date math only.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type HolidayResult = {
  name: string;
  multiplier: 1.5 | 2;
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns the Nth occurrence of a weekday in a month.
 *  weekday: 0=Sun, 1=Mon, …, 6=Sat  |  n: 1-based (1st, 2nd, …) */
function nthWeekday(
  year: number,
  month: number, // 1-based
  weekday: number,
  n: number,
): Date {
  const d = new Date(year, month - 1, 1);
  let count = 0;
  while (true) {
    if (d.getDay() === weekday) {
      count++;
      if (count === n) return new Date(d);
    }
    d.setDate(d.getDate() + 1);
  }
}

/** Returns the last occurrence of a weekday in a given month. */
function lastWeekday(
  year: number,
  month: number, // 1-based
  weekday: number,
): Date {
  // Start from last calendar day of month and walk backwards
  const d = new Date(year, month, 0); // day 0 = last day of previous month → last day of `month`
  while (d.getDay() !== weekday) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

/** Parses "YYYY-MM-DD" without UTC offset (treats as local date). */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// ─── Holiday detection ────────────────────────────────────────────────────────

/**
 * Returns the holiday multiplier for a given event date, or null if the date
 * is not a recognized holiday.
 *
 * Note on New Year's Eve: Terms specify 1.5× "after 12pm." Since the quote
 * generator doesn't know the exact show time at this point in calculation,
 * 1.5× is applied for the full day. A Producer will adjust if the event ends
 * before noon.
 */
export function getHolidayRate(dateStr: string): HolidayResult | null {
  if (!dateStr) return null;

  const d = parseLocalDate(dateStr);
  const month = d.getMonth() + 1; // 1-based
  const day = d.getDate();
  const year = d.getFullYear();

  // ── 2× holidays ────────────────────────────────────────────────────────────

  // Thanksgiving: 4th Thursday of November
  const thanksgiving = nthWeekday(year, 11, 4, 4);
  if (month === 11 && day === thanksgiving.getDate()) {
    return { name: "Thanksgiving", multiplier: 2 };
  }

  // Christmas Eve: December 24
  if (month === 12 && day === 24) {
    return { name: "Christmas Eve", multiplier: 2 };
  }

  // Christmas Day: December 25
  if (month === 12 && day === 25) {
    return { name: "Christmas Day", multiplier: 2 };
  }

  // ── 1.5× holidays ──────────────────────────────────────────────────────────

  // New Year's Day: January 1
  if (month === 1 && day === 1) {
    return { name: "New Year's Day", multiplier: 1.5 };
  }

  // Memorial Day: last Monday of May
  const memorialDay = lastWeekday(year, 5, 1);
  if (month === 5 && day === memorialDay.getDate()) {
    return { name: "Memorial Day", multiplier: 1.5 };
  }

  // Independence Day: July 4th
  if (month === 7 && day === 4) {
    return { name: "Independence Day (July 4th)", multiplier: 1.5 };
  }

  // Labor Day: first Monday of September
  const laborDay = nthWeekday(year, 9, 1, 1);
  if (month === 9 && day === laborDay.getDate()) {
    return { name: "Labor Day", multiplier: 1.5 };
  }

  // Black Friday: day after Thanksgiving
  const blackFriday = new Date(thanksgiving);
  blackFriday.setDate(blackFriday.getDate() + 1);
  if (month === 11 && day === blackFriday.getDate()) {
    return { name: "Black Friday", multiplier: 1.5 };
  }

  // New Year's Eve: December 31
  if (month === 12 && day === 31) {
    return { name: "New Year's Eve", multiplier: 1.5 };
  }

  return null;
}

// ─── Rush booking detection ───────────────────────────────────────────────────

/**
 * Counts weekday (Mon–Fri) business days from `fromStr` up to and including
 * `toStr`, excluding `fromStr` itself.
 *
 * Example: Mon→Wed = Tue + Wed = 2 business days.
 */
function businessDaysUntil(fromStr: string, toStr: string): number {
  const from = parseLocalDate(fromStr);
  const to = parseLocalDate(toStr);
  if (to <= from) return 0;

  let count = 0;
  const cursor = new Date(from);
  cursor.setDate(cursor.getDate() + 1); // start counting from the day after 'from'

  while (cursor <= to) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) count++; // skip Sun (0) and Sat (6)
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/**
 * Returns true when the event qualifies for the rush fee —
 * i.e., fewer than 2 full business days' notice (per Terms §3).
 *
 * `todayStr` defaults to today's date (YYYY-MM-DD). Pass it explicitly in
 * tests or server contexts where `new Date()` might be unreliable.
 */
export function isRushBooking(eventDateStr: string, todayStr?: string): boolean {
  if (!eventDateStr) return false;
  const today =
    todayStr ?? new Date().toISOString().split("T")[0];
  return businessDaysUntil(today, eventDateStr) < 2;
}
