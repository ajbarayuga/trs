import type { QuoteFormData } from "@/schema/quote";
import { SERVICE_WINDOWS as SW } from "@/lib/constants";

// ─────────────────────────────────────────────────────────────────────────────
// calculateWorkPlan.ts
//
// Intelligently generates a work plan from form data.
// No hardcoded times. Every row is computed from:
//   - Which services/capabilities are active
//   - Show start time (or 12pm default)
//   - Show end time (explicit or derived from duration)
//   - Cocktail hour flag
//   - Doors time flag
//   - PA flag (triggers soundcheck row)
//
// Setup and strike windows per capability are defined in SETUP_MINUTES /
// STRIKE_MINUTES. Staff arrival = showStart − max(setupWindows).
// Staff departure = lastEventTime + max(strikeWindows).
// AV ready is always showStart − 30 min (fixed buffer, every show).
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkPlanRow {
  time: string; // e.g. "4:00 PM" or "End + 90 min"
  description: string;
}

export interface WorkPlanResult {
  dateHeader: string; // e.g. "August 21st:" — empty string if no date
  rows: WorkPlanRow[];
  usedDefaultTime: boolean; // true if 12pm was assumed (no times provided)
  isStudio: boolean; // true if studio session (different structure)
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Convert "HH:MM" to total minutes since midnight */
function toMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Convert total minutes since midnight back to "HH:MM" */
function fromMins(mins: number): string {
  // wrap past midnight gracefully
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Convert "HH:MM" (24h) → "H:MM AM/PM" */
export function formatTo12h(t: string): string {
  if (!t || t === "TBD") return "TBD";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/** Add minutes to a "HH:MM" string, returns "HH:MM" */
function addMins(t: string, delta: number): string {
  return fromMins(toMins(t) + delta);
}

/** Format a date string (YYYY-MM-DD) into "Month Dth:" header */
function formatDateHeader(dateStr: string): string {
  if (!dateStr) return "";
  try {
    // Parse as local date to avoid UTC off-by-one
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    const monthName = d.toLocaleDateString("en-US", { month: "long" });
    const dayNum = d.getDate();
    const suffix =
      dayNum === 1 || dayNum === 21 || dayNum === 31
        ? "st"
        : dayNum === 2 || dayNum === 22
          ? "nd"
          : dayNum === 3 || dayNum === 23
            ? "rd"
            : "th";
    return `${monthName} ${dayNum}${suffix}:`;
  } catch {
    return "";
  }
}

// ─── Setup / Strike lookup tables (in minutes) ────────────────────────────────
//
// These are the authoritative source. When spec changes, update here only.
// calculateSOW.ts references these indirectly through the service flags —
// this file is the single place that maps capability → time windows.

interface TimeWindow {
  setup: number; // minutes before show start crew needs to arrive
  strike: number; // minutes after last event crew needs to leave
}

function getServiceWindows(data: QuoteFormData): TimeWindow[] {
  const windows: TimeWindow[] = [];
  const isStreamingActive = data.services.includes("streaming");
  const activeVideoTypes = data.services.includes("video")
    ? (data.videoTypes ?? [])
    : [];
  const isPAActive = data.audioServices.includes("pa");
  const isOutdoor = data.setting === "outdoor";
  const lighting = data.lightingServices ?? [];

  // ── Live Streaming ──────────────────────────────────────────────────────────
  if (isStreamingActive) {
    windows.push(SW.streaming);
  }

  // ── Lecture / Panel ─────────────────────────────────────────────────────────
  // If lectureFromStream is true and streaming is also active, camera is shared
  // so we don't add a duplicate window — streaming's larger window already covers it.
  if (activeVideoTypes.includes("lecture") && data.eventType === "live") {
    if (!isStreamingActive || !data.lectureFromStream) {
      windows.push(SW.lecture);
    }
  }

  // ── Event Highlight ─────────────────────────────────────────────────────────
  if (activeVideoTypes.includes("highlight") && data.eventType === "live") {
    windows.push(SW.highlight);
  }

  // ── PA / Audio ──────────────────────────────────────────────────────────────
  if (isPAActive) {
    windows.push(isOutdoor ? SW.paOutdoor : SW.paIndoor);
  }

  // ── Projector + Screen ──────────────────────────────────────────────────────
  // Serial totals: screen barn-raise + PJ setup. See SERVICE_WINDOWS in constants.ts.
  // Built-in projector → skipped
  if (data.wantsProjector && !data.builtInAV?.includes("projector")) {
    const is16ft = data.projectorScreenSize === "16ft";
    windows.push(is16ft ? SW.projector16ft : SW.projector12ft);
  }

  // ── Big Screen TVs ──────────────────────────────────────────────────────────
  if (data.wantsTVs && !data.builtInAV?.includes("tvs")) {
    windows.push(SW.tv);
  }

  // ── Confidence Monitors ─────────────────────────────────────────────────────
  if (data.wantsConfidenceMonitors) {
    windows.push(SW.confidenceMonitor);
  }

  // ── Stage Wash ──────────────────────────────────────────────────────────────
  if (lighting.includes("stage-wash")) {
    windows.push(SW.stageWash);
  }

  // ── Stage Uplights ──────────────────────────────────────────────────────────
  // Per kit (1 kit = per 10ft of stage width)
  if (lighting.includes("uplights-stage")) {
    const kits = Math.max(1, Math.ceil((data.stageWashWidth ?? 10) / 10));
    windows.push({
      setup: SW.stageUplightsPerKit.setup * kits,
      strike: SW.stageUplightsPerKit.strike * kits,
    });
  }

  // ── Wireless Uplights ───────────────────────────────────────────────────────
  // Per pack (1 pack = 6 units)
  if (lighting.includes("wireless-uplights")) {
    const packs = Math.max(1, Math.floor((data.wirelessUplightCount ?? 6) / 6));
    windows.push({
      setup: SW.wirelessUplightsPerPack.setup * packs,
      strike: SW.wirelessUplightsPerPack.strike * packs,
    });
  }

  // ── Spotlight ───────────────────────────────────────────────────────────────
  if (lighting.includes("spotlight")) {
    windows.push(SW.spotlight);
  }

  // ── Photography ─────────────────────────────────────────────────────────────
  if ((data.photographyServices ?? []).length > 0) {
    windows.push(SW.photography);
  }

  return windows;
}

// ─── Studio work plan (different structure — session based, not show based) ───

function buildStudioWorkPlan(data: QuoteFormData): WorkPlanResult {
  const dateHeader =
    data.hasDate && data.eventDate ? formatDateHeader(data.eventDate) : "";

  const DEFAULT_SESSION = "10:00"; // 10am default for studio sessions
  const rawSession = data.startTime?.trim() || DEFAULT_SESSION;
  const usedDefaultTime = !data.startTime?.trim();

  const studioDuration = data.studioHasDuration
    ? (data.studioDurationHours ?? 4)
    : 4;

  const setupMins = SW.studio.setup;   // 150 min (2.5h)
  const strikeMins = SW.studio.strike; // 90 min (1.5h)

  const arrivalTime = addMins(rawSession, -setupMins);
  const guestArrivalTime = addMins(rawSession, -15); // guests 15min before recording
  const sessionEndTime = addMins(rawSession, studioDuration * 60);
  const departureTime = addMins(sessionEndTime, strikeMins);

  const rows: WorkPlanRow[] = [
    {
      time: formatTo12h(arrivalTime),
      description: "Our crew arrives and begins studio setup.",
    },
    {
      time: formatTo12h(guestArrivalTime),
      description:
        "Guests should arrive to be mic'd up and get comfortable before recording begins.",
    },
    {
      time: formatTo12h(rawSession),
      description: "Recording session begins.",
    },
    {
      time: formatTo12h(sessionEndTime),
      description: "Recording session concludes.",
    },
    {
      time: formatTo12h(departureTime),
      description: "Our crew is packed up and leaves.",
    },
  ];

  return { dateHeader, rows, usedDefaultTime, isStudio: true };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function computeWorkPlan(data: QuoteFormData): WorkPlanResult {
  // Studio gets its own structure
  if (data.eventType === "studio") {
    return buildStudioWorkPlan(data);
  }

  const dateHeader =
    data.hasDate && data.eventDate ? formatDateHeader(data.eventDate) : "";

  // ── Resolve show start ──────────────────────────────────────────────────────
  const DEFAULT_SHOW_START = "12:00";
  const rawStart =
    data.hasShowTimes && data.startTime?.trim()
      ? data.startTime.trim()
      : DEFAULT_SHOW_START;
  const usedDefaultTime = !data.hasShowTimes || !data.startTime?.trim();

  // ── Resolve show end ────────────────────────────────────────────────────────
  // Priority: explicit endTime → derived from duration → unknown
  let rawEnd: string | null = null;
  if (data.hasShowTimes && data.hasEndTime && data.endTime?.trim()) {
    rawEnd = data.endTime.trim();
  } else if (data.hasDuration && (data.durationHours ?? 0) > 0) {
    rawEnd = addMins(rawStart, (data.durationHours ?? 4) * 60);
  }
  // rawEnd stays null if truly unknown

  // ── Compute setup and strike from active capabilities ──────────────────────
  const windows = getServiceWindows(data);

  // If no capabilities selected, use a sensible minimum
  const maxSetup =
    windows.length > 0 ? Math.max(...windows.map((w) => w.setup)) : 60;
  const maxStrike =
    windows.length > 0 ? Math.max(...windows.map((w) => w.strike)) : 30;

  // ── Derive anchor times ────────────────────────────────────────────────────
  const staffArrivesTime = addMins(rawStart, -maxSetup);
  const avReadyTime = addMins(rawStart, -30); // always 30 min before show start
  const isPAActive = data.audioServices.includes("pa");
  const soundcheckTime = addMins(rawStart, -60); // 1h before show if PA active

  // Last event time = cocktail hour end (if applicable) or show end
  const cocktailEndTime =
    rawEnd && data.hasMinglingCocktailHour ? addMins(rawEnd, 60) : null;
  const lastEventTime = cocktailEndTime ?? rawEnd;
  const staffLeavesTime = lastEventTime
    ? addMins(lastEventTime, maxStrike)
    : null;

  // ── Build rows ─────────────────────────────────────────────────────────────
  const rows: WorkPlanRow[] = [];

  // Row 1: Staff arrives
  rows.push({
    time: formatTo12h(staffArrivesTime),
    description: "Our staff arrives at the venue and begins their setup.",
  });

  // Row 2: Soundcheck (only if PA active, and it's meaningfully separate from arrival)
  if (isPAActive && toMins(soundcheckTime) > toMins(staffArrivesTime)) {
    rows.push({
      time: formatTo12h(soundcheckTime),
      description: "Soundcheck begins.",
    });
  }

  // Row 3: AV all set / room ready (always 30 min before show)
  // Only emit if it's later than staff arrival
  if (toMins(avReadyTime) > toMins(staffArrivesTime)) {
    rows.push({
      time: formatTo12h(avReadyTime),
      description:
        "AV elements are all set and checked. The room is audience-ready.",
    });
  }

  // Row 4: Doors open (only if different from show start)
  if (
    data.hasShowTimes &&
    data.hasDifferentDoorsTime &&
    data.doorsTime?.trim()
  ) {
    rows.push({
      time: formatTo12h(data.doorsTime.trim()),
      description: "Doors open.",
    });
  }

  // Row 5: Program begins
  rows.push({
    time: formatTo12h(rawStart),
    description: "The program begins.",
  });

  // Row 6: Program ends
  if (rawEnd) {
    rows.push({
      time: formatTo12h(rawEnd),
      description: "The program concludes.",
    });
  }

  // Row 7: Cocktail / reception ends
  if (cocktailEndTime) {
    rows.push({
      time: formatTo12h(cocktailEndTime),
      description: "The reception concludes.",
    });
  }

  // Row 8: Staff packed up and leaves
  if (staffLeavesTime) {
    rows.push({
      time: formatTo12h(staffLeavesTime),
      description: "Our staff is packed up and leaves the venue.",
    });
  } else {
    // End time unknown — show relative offset
    const strikeLabel =
      maxStrike >= 60 ? `${maxStrike / 60}h` : `${maxStrike} min`;
    rows.push({
      time: `End + ${strikeLabel}`,
      description: "Our staff is packed up and leaves the venue.",
    });
  }

  return { dateHeader, rows, usedDefaultTime, isStudio: false };
}
