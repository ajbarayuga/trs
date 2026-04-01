/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE RECORDING SERVICE — MASTER PRICE LIST
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * All prices are in US DOLLARS (USD).
 *
 * This is the single file to update when rates change.
 * calculateSOW.ts imports from here — no hardcoded numbers anywhere else.
 *
 * HOW TO UPDATE:
 *   1. Edit the dollar amounts below
 *   2. Save the file
 *   3. All quotes immediately reflect the new pricing — no other files to touch
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const CURRENCY = {
  symbol: "$",
  code: "USD",
  locale: "en-US",
} as const;

// ─── Labor billing rules ──────────────────────────────────────────────────────
//
// Per work plan spec:
//   The Production Lead is the only crew member billed strictly hourly.
//   All other techs (streaming, camera, lighting, etc.) are on a day-rate
//   baseline of 10 hours — meaning the customer is charged for at least
//   10 hours regardless of actual time on site. Hours beyond 10 are billed
//   at the standard hourly rate (overtime applies to everyone).
//
// calculateSOW.ts uses techHrs() to enforce this minimum for non-PL labor.
export const DAY_RATE_MIN_HOURS = 10;

// ─── Surcharge rates ──────────────────────────────────────────────────────────
export const RUSH_FEE_RATE = 0.20; // 20% of quoted total (Terms §3)

export const RATES = {
  // ── Labor (per hour) ──────────────────────────────────────────────────────
  labor: {
    productionLead: 117.99, // Production Lead hourly rate
    lightingTech: 95.0, // Lighting Technician hourly rate
    videoTech: 95.0, // Video Tech (lecture/general) hourly rate
    streamingTech: 117.99, // Streaming Tech hourly rate
    cameraOperator: 95.0, // Camera Operator per person hourly rate
  },

  // ── Equipment (flat / per-unit rates) ────────────────────────────────────
  equipment: {
    studioCameraKit: 750.0, // 2x Mirrorless Kit + Studio Lighting
    camcorderKit: 395.0, // Camcorder Kit (lecture / streaming)
    streamControlKit: 600.0, // Encoder & Switcher System
    mirrorlessHalfDay: 375.0, // Mirrorless Kit — half day (<4hrs)
    mirrorlessFullDay: 600.0, // Mirrorless Kit — full day (4hrs+)
    mirrorlessAddOn: 375.0, // Mirrorless Kit add-on for Social Shorts
    additionalCamKit: 395.0, // Extra camera kit per angle
    projector: 1_100.0, // Projector unit
    projectorScreen12ft: 700.0, // 12ft projection screen (per unit)
    projectorScreen16ft: 900.0, // 16ft projection screen (per unit)
    projectorAccessories: 125.0, // Projector accessory kit
    sdiKit: 175.0, // SDI kit per extra screen/TV
    tv85inch: 400.0, // 85" TV (per unit)
    tv75inch: 325.0, // 75" TV (per unit)
    tvAccessories: 75.0, // TV accessory kit
    confidenceMonitor: 225.0, // Confidence monitor (per unit)
    stagingWashKit: 600.0, // Stage wash lighting kit
    stageUplightKit: 200.0, // Stage uplight kit per 10ft
    wirelessUplightPack: 400.0, // Wireless uplight pack of 6
    spotlight: 500.0, // Spotlight / Follow-spot kit
    trucking: 400.0, // Trucking flat fee
    indoorAudioKit: 900.0, // Indoor PA system
    outdoorAudioKit: 1_250.0, // Outdoor PA system
    extraSpeaker: 175.0, // Additional speaker (per unit)
    stageMonitor: 150.0, // Stage monitor wedge (per unit)
  },

  // ── Microphones (per unit per event) ─────────────────────────────────────
  mics: {
    wirelessHandheld: 125.0,
    wirelessLav: 125.0,
    wiredSM58: 60.0,
    wiredGooseneck: 75.0,
    vogWireless: 125.0, // VOG wireless handheld
    vogWired: 60.0, // VOG wired mic
    rockBandLocker: 750.0, // Full rock band mic locker
  },

  // ── Post-Production (per unit) ────────────────────────────────────────────
  postProduction: {
    podcastEdit: 300.0, // Per episode
    webVideoEdit: 225.0, // Per video
    webVideoFilming: 62.5, // Per 30-min filming slot
    lectureEditNoPPT: 225.0, // Per talk, no PPT
    lectureEditWithPPT: 315.0, // Per talk, with PPT slides
    highlightEdit: 600.0, // Event highlight reel (flat)
    socialShortEdit: 125.0, // Per short
  },

  // ── Photography (flat per event) ─────────────────────────────────────────
  photography: {
    photoBooth: 1_000.0,
    eventPhotography: 900.0,
    portraits: 600.0,
  },

  // ── Stream Setup ─────────────────────────────────────────────────────────
  streaming: {
    streamLinkSetup: 125.0, // Stream destination config (if not DIY)
    streamGraphicsPrep: 250.0, // On-screen overlays & branding
  },
} as const;

// ─── Type export for any file that needs to reference a rate key ──────────────
export type RateKey = typeof RATES;
