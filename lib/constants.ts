// ─── Shared business-rule constants ───────────────────────────────────────────
//
// Single source of truth for limits that appear in BOTH schema/quote.ts AND
// lib/quoteRedirect.ts. Change a value here → both files stay in sync.
//
// Also the authoritative setup/strike windows (minutes) per service capability.
// calculateWorkPlan.ts imports these directly for staff-arrival math.
// calculateSOW.ts derives billable overhead hours from them: (setup + strike) / 60.
// ─────────────────────────────────────────────────────────────────────────────

// ── Quote form limits ─────────────────────────────────────────────────────────

export const QUOTE_LIMITS = {
  /** Max attendance before redirect to sales. Schema max must equal this. */
  maxAttendance: 400,
  /** Max web videos per booking day. Schema max must equal this. */
  maxWebVideoCount: 12,
  /** Max web video duration in minutes. Schema max must equal this. */
  maxWebVideoDurationMins: 3,
} as const;

// ── Service setup / strike windows (minutes) ──────────────────────────────────
//
// "setup" = minutes before show start the crew must arrive.
// "strike" = minutes after the last event moment before crew departs.
//
// For services that scale (uplights, projector), the per-unit window is defined
// and callers multiply by kit/pack/screen count.
//
// Projector windows are SERIAL totals:
//   projector12ft.setup = screen barn-raise (120) + PJ setup (60) = 180
//   projector16ft.setup = screen barn-raise (150) + PJ setup (60) = 210
// SOW bills screen labor (2 techs) and PJ labor (1 tech) separately.

export const SERVICE_WINDOWS = {
  // Streaming has two variants — pick based on cameraSource in each caller:
  streamingBuiltIn:        { setup:  90, strike:  30 }, // venue cameras/system: 1.5h setup + 0.5h pack out
  streamingOurEquip:       { setup: 180, strike:  90 }, // TRS cameras/system:   3h setup  + 1.5h pack out
  lecture:                 { setup:  90, strike:  30 }, // 1.5h setup + 0.5h pack out
  highlight:               { setup:  30, strike:  30 },
  paIndoor:                { setup:  90, strike:  45 },
  paOutdoor:               { setup: 120, strike:  60 },
  stageWash:               { setup: 120, strike:  60 },
  stageUplightsPerKit:     { setup:  30, strike:  15 },
  wirelessUplightsPerPack: { setup:  30, strike:  15 },
  spotlight:               { setup:  60, strike:  30 },
  projector12ft:           { setup: 180, strike: 120 }, // serial total (see note above)
  // FIX: strike was incorrectly 150 (included PJ strike 30min on top of screen barn-lower 120min).
  // Screen barn-lower for 16ft = 120min (2h), same as 12ft. PJ strike (30min) is billed
  // separately as part of "Projector Setup & Strike" (1h setup + 30min strike = 1.5h flat).
  // Correct serial total: screen barn-lower (120) + PJ strike (30) = 150 — but since the
  // SOW formula subtracts PJ setup (60) from the setup side only, the strike window must
  // also exclude PJ strike so that screenHrsEach = (setup-60 + strike) / 60 yields
  // the correct screen-only labor: 2h up + 2h down = 4h (12ft), 2.5h up + 2h down = 4.5h (16ft).
  projector16ft:           { setup: 210, strike: 120 }, // serial total; screen barn-lower = 120min (same as 12ft)
  tv:                      { setup:  60, strike:  30 },
  confidenceMonitor:       { setup:  30, strike:  15 },
  photography:             { setup:  15, strike:  15 },
  studio:                  { setup: 150, strike:  90 }, // 2.5h setup + 1.5h packup
} as const;

export type ServiceWindow = (typeof SERVICE_WINDOWS)[keyof typeof SERVICE_WINDOWS];

/**
 * Convert a service window into billable overhead hours for the SOW.
 * overhead = (setup_mins + strike_mins) / 60
 */
export function overheadHours(w: { setup: number; strike: number }): number {
  return (w.setup + w.strike) / 60;
}
