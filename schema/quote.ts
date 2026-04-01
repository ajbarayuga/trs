import { z } from "zod";
import { DEFAULT_DOORS_TIME, DEFAULT_START_TIME } from "@/lib/quoteDefaults";
import { QUOTE_LIMITS } from "@/lib/constants";

// ─── Field length constants ────────────────────────────────────────────────────
// Centralised so limits are easy to review and adjust in one place.
// These caps prevent oversized payloads from bloating email bodies and PDFs.
const MAX = {
  name: 100, // Human names, org names, event names
  email: 254, // RFC 5321 max email length
  phone: 30, // E.164 + formatting chars
  venueName: 150,
  subject: 200,
  message: 2_000, // NotSure / contact-sales free-text
  feedback: 1_000, // In-quote feedback textarea
  additionalPOC: 200,
} as const;

// ─── Lead Capture (NotSure / Contact Sales form) ───────────────────────────────
export const LeadCaptureSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required").max(MAX.name),
  lastName: z.string().trim().min(2, "Last name is required").max(MAX.name),
  email: z.string().email("Invalid email address").max(MAX.email).toLowerCase(),
  subject: z
    .string()
    .trim()
    .min(5, "Subject is too short")
    .max(MAX.subject, "Subject is too long"),
  message: z
    .string()
    .trim()
    .min(10, "Please provide more detail")
    .max(MAX.message, "Message is too long (2,000 character limit)"),
  privacyPolicy: z.literal(true, { message: "Acceptance is required" }),
  // Honeypot — must remain empty. Bots fill every visible field.
  website_url: z.string().max(0).optional(),
});

// ─── Quote Form ────────────────────────────────────────────────────────────────
export const QuoteFormSchema = z.object({
  // ── Step 2: Time & Place ─────────────────────────────────────────────────

  eventType: z.enum(["live", "studio", "other"]).default("live"),

  // Live event
  hasDate: z.boolean().default(false),
  eventDate: z.string().optional(),
  isMultiDay: z.boolean().default(false),
  venueType: z.enum(["single", "multiple", "tbd"]).default("single"),
  setting: z.enum(["indoor", "outdoor"]).default("indoor"),
  hasShowTimes: z.boolean().default(false),
  startTime: z.string().default(DEFAULT_START_TIME),
  hasDifferentDoorsTime: z.boolean().default(false),
  doorsTime: z.string().default(DEFAULT_DOORS_TIME),
  hasEndTime: z.boolean().default(false),
  endTime: z.string().default(""),
  hasMinglingCocktailHour: z.boolean().default(false),
  hasDuration: z.boolean().default(false),
  // max(24) added — a real event won't exceed 24hrs; prevents payload inflation
  durationHours: z.coerce.number().min(1).max(24).default(4),

  // Studio recording — new fields
  studioHasDuration: z.boolean().default(false),
  studioDurationHours: z.coerce.number().min(0.5).max(24).default(4),
  studioLocationType: z.enum(["office", "studio-rental"]).default("office"),

  // Shared
  locationType: z.enum(["office", "rented"]).default("office"),
  // ── KEPT as z.array(z.string()) ──
  // Changing array fields to strict enums would silently break localStorage
  // draft restoration for any user who saved a draft before this schema shipped.
  // The UI only ever writes known values into these fields, so they're safe.
  // Strict enum validation on array fields is a "future migration" task.
  builtInAV: z.array(z.string()).default([]),

  // ── Step 3: Services — Streaming ─────────────────────────────────────────

  services: z.array(z.string()).default([]), // UI: "streaming" | "video"
  isZoomOnly: z.boolean().default(false),
  cameraSource: z.enum(["built-in", "bring"]).default("bring"),
  // KEPT as z.string() — calculateSOW and redirect guards do string comparisons
  // on this field. A strict enum risks breaking restored drafts.
  cameraCount: z.string().default("1"),
  streamGraphics: z.boolean().default(false),
  diyStream: z.boolean().default(false),
  // When 2 cameras are selected: true = 1 camera is unmanned (only 1 operator billed).
  // Spec: "There will always be at least 1 manned camera. Unmanned cameras still have
  // to be set up and torn down, but do not need an operator during the show."
  hasUnmannedCameras: z.boolean().default(false),

  // ── Step 3: Services — Video ─────────────────────────────────────────────

  videoTypes: z.array(z.string()).default([]), // UI: "highlight"|"lecture"|etc.

  // Web Video
  webVideoPeople: z.coerce.number().min(1).max(50).default(1),
  webVideoCount: z.coerce.number().min(1).max(QUOTE_LIMITS.maxWebVideoCount).default(1),
  // max matches QUOTE_LIMITS.maxWebVideoDurationMins — redirect guard uses the same constant
  webVideoDuration: z.coerce.number().min(1).max(QUOTE_LIMITS.maxWebVideoDurationMins).default(3),

  // Podcast
  podcastEpisodes: z.coerce.number().min(1).max(20).default(1),
  podcastDuration: z.coerce.number().min(1).max(12).default(1),

  // Event Highlight
  highlightSessions: z.coerce.number().min(1).max(3).default(1),
  highlightDurationHours: z.coerce.number().min(1).max(24).default(4),

  // Lecture / Panel Discussion
  lectureTalksCount: z.coerce.number().min(1).max(50).default(1),
  lectureTalkDuration: z
    .enum(["up to 1hr", "up to 2hr", "up to 3hr", "longer (call sales)"])
    .default("up to 1hr"),
  lecturePPT: z.boolean().default(false),
  lectureFromStream: z.boolean().default(false),
  additionalAngles: z.boolean().default(false),
  angleCount: z.coerce.number().min(0).max(10).default(0),

  // Social Shorts
  wantsSocialShorts: z.boolean().default(false),
  socialShortsCount: z.coerce.number().min(0).max(50).default(0),
  shortsSource: z.enum(["filming", "recut"]).default("recut"),

  // ── Step 4: Audio Services ────────────────────────────────────────────────

  audioServices: z.array(z.string()).default([]), // UI: "pa" | "band" | "recording"

  // Mic counts — upper bound of 20 is realistic for any standard event
  micWirelessHandheld: z.coerce.number().min(0).max(20).default(0),
  micWirelessLav: z.coerce.number().min(0).max(20).default(0),
  micWiredSM58: z.coerce.number().min(0).max(20).default(0),
  micWiredGooseneck: z.coerce.number().min(0).max(20).default(0),
  micRockBand: z.boolean().default(false),
  micNotSure: z.boolean().default(false),

  // Playback
  playbackEnabled: z.boolean().default(false),
  playbackSource: z.enum(["client", "spotify"]).optional(),

  // Voice of God
  vogEnabled: z.boolean().default(false),
  vogAlreadyCounted: z.boolean().default(false),
  vogMicType: z.enum(["handheld", "wired"]).optional(),
  vogAnnouncer: z.enum(["team", "tech"]).optional(),

  // Monitors
  monitorsEnabled: z.boolean().default(false),
  monitors: z.coerce.number().min(0).max(20).default(0),

  // Attendance — max matches QUOTE_LIMITS.maxAttendance; redirect guard uses the same constant
  attendance: z.coerce.number().min(0).max(QUOTE_LIMITS.maxAttendance).default(0),

  // ── Step 4: More Event AV ─────────────────────────────────────────────────

  wantsProjector: z.boolean().default(false),
  projectorScreenSize: z.enum(["12ft", "16ft", "not-sure"]).optional(),
  projectorScreenCount: z.coerce.number().min(0).max(4).default(1),

  wantsTVs: z.boolean().default(false),
  tvSize: z.enum(["85", "75", "other"]).optional(),
  tvCount: z.coerce.number().min(0).max(4).default(1),
  tvStand: z.enum(["truss", "cart", "floor", "other"]).optional(),

  wantsConfidenceMonitors: z.boolean().default(false),
  confidenceMonitorCount: z.coerce.number().min(0).max(4).default(1),

  // Lighting
  lightingServices: z.array(z.string()).default([]),
  stageWashWidth: z.coerce.number().min(0).max(200).default(10),
  wirelessUplightCount: z.coerce.number().min(6).max(48).default(6),

  // Photography
  photographyServices: z.array(z.string()).default([]),

  // ── Step 5: It's All About You ────────────────────────────────────────────

  eventName: z
    .string()
    .trim()
    .min(1, "Event name is required")
    .max(MAX.name, "Event name is too long")
    .default("Untitled Event"),
  isSpecQuote: z.boolean().default(false),
  clientName: z.string().trim().max(MAX.name).optional(),
  clientPhone: z.string().trim().max(MAX.phone).optional(),
  organization: z.string().trim().max(MAX.name).optional(),
  venueName: z.string().trim().max(MAX.venueName).optional(),
  hasAdditionalPOC: z.boolean().default(false),
  additionalPOC: z.string().trim().max(MAX.additionalPOC).optional(),

  // ── Step 6: Send ─────────────────────────────────────────────────────────

  deliveryEmail: z
    .string()
    .email("Please provide a valid email to receive your quote")
    .max(MAX.email)
    .toLowerCase()
    .default(""),
  newsletterConsent: z.boolean().default(false),
  feedback: z
    .string()
    .trim()
    .max(MAX.feedback, "Feedback is too long (1,000 character limit)")
    .optional(),
});

export type LeadCaptureData = z.infer<typeof LeadCaptureSchema>;
export type QuoteFormData = z.infer<typeof QuoteFormSchema>;
