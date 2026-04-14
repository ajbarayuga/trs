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
    productionLead: 121.5297, // 2026 Emory: Production Lead hourly
    lightingTech: 69.525, // Lighting Tech day rate 695.25 / 10h baseline
    videoTech: 69.525, // Video Tech aligns with standard AV tech lane
    streamingTech: 84.975, // Stream Tech day rate 849.75 / 10h baseline
    cameraOperator: 76.735, // Camera Operator day rate 767.35 / 10h baseline
  },

  // ── Equipment (flat / per-unit rates) ────────────────────────────────────
  equipment: {
    studioCameraKit: 441.87, // Studio Camera Kit
    camcorderKit: 406.85, // Camcorder Kit (lecture / streaming)
    streamControlKit: 509.85, // Stream Kit (encoder/switcher package)
    mirrorlessHalfDay: 375.0, // Mirrorless Kit — half day (<4hrs)
    mirrorlessFullDay: 600.0, // Mirrorless Kit — full day (4hrs+)
    mirrorlessAddOn: 375.0, // Mirrorless Kit add-on for Social Shorts
    additionalCamKit: 406.85, // Additional camera kit
    projector: 669.5, // 8K projector reference lane
    projectorScreen12ft: 515.0, // 12' with dress kit
    projectorScreen16ft: 875.5, // 16' with dress kit
    projectorAccessories: 159.65, // Graphic Display / projector accessory kit
    sdiKit: 56.65, // Long video cable kit
    tv85inch: 772.5, // 85" TV w/ truss mounting
    tv75inch: 463.5, // 75" TV w/ truss mounting
    tvAccessories: 159.65, // Graphic display accessory kit
    confidenceMonitor: 56.65, // 32" confidence monitor baseline
    stagingWashKit: 303.85, // Stage lighting kit
    stageUplightKit: 87.55, // Wired uplight kit
    wirelessUplightPack: 247.2, // Wireless uplight kit (6 fixtures)
    spotlight: 247.2, // Followspot
    trucking: 309.0, // Trucking in + out (154.5 each)
    indoorAudioKit: 307.97, // Analog Sound System Kit
    outdoorAudioKit: 410.97, // Outdoor Analog Sound System Kit
    extraSpeaker: 66.95, // Additional speaker (per unit)
    stageMonitor: 56.65, // Reused monitor lane until dedicated rate is mapped
    avEssentialKit: 99.95, // Required onsite misc kit
    avEssentialKitHalfDay: 61.8, // Half-day misc kit (<=4h specific workflows)
  },

  // ── Microphones (per unit per event) ─────────────────────────────────────
  mics: {
    wirelessHandheld: 128.75,
    wirelessLav: 128.75,
    wiredSM58: 36.05,
    wiredGooseneck: 77.25,
    vogWireless: 128.75, // VOG wireless handheld
    vogWired: 36.05, // VOG wired mic
    rockBandLocker: 399.0, // Live Event Mic Locker
  },

  // ── Post-Production (per unit) ────────────────────────────────────────────
  postProduction: {
    podcastEdit: 360.0, // Podcast - up to 1 hour
    webVideoEdit: 225.0, // Per video
    webVideoFilming: 62.5, // Per 30-min filming slot
    lectureEditNoPPT: 231.75, // Lecture/Event <=1h no PPT
    lectureEditWithPPT: 324.45, // Lecture/Event <=1h with PPT
    highlightEdit: 921.85, // Event highlight video package
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
    streamLinkSetup: 102.9485, // Zoom/YouTube stream setup lane
    streamGraphicsPrep: 154.4485, // Stream graphics prep
  },
} as const;

// ─── Type export for any file that needs to reference a rate key ──────────────
export type RateKey = typeof RATES;
