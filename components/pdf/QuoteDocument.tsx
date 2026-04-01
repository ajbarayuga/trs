import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { QuoteFormData } from "@/schema/quote";
import type { LineItem } from "@/lib/calculateSOW";
import { computeWorkPlan } from "@/lib/calculateWorkPlan";
import { fmt } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "TBD";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── design tokens ────────────────────────────────────────────────────────────

const MARGIN = 48;
const BLUE = "#1155CC";
const PINK_BG = "#FADADD";
const PINK_TITLE = "#880000";

// ─── styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111111",
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: MARGIN,
  },

  // ── Cover page ──────────────────────────────────────────────────────────────
  coverVersionLine: {
    position: "absolute",
    top: 20,
    left: MARGIN,
    fontSize: 8,
    color: "#999999",
    fontFamily: "Helvetica-Oblique",
  },
  coverRefLine: {
    position: "absolute",
    bottom: 32,
    right: MARGIN,
    fontSize: 8,
    color: "#999999",
    fontFamily: "Helvetica-Oblique",
  },
  // Date line — bold, centered, above event name
  coverDate: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#333333",
    textAlign: "center",
    marginTop: 52,
    marginBottom: 8,
  },
  // Event name — very large bold centered
  coverEventName: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 20,
  },
  // Services line — large, normal weight
  coverServicesLine: {
    fontSize: 22,
    color: "#333333",
    textAlign: "center",
    marginBottom: 44,
  },
  coverPartyBlock: {
    marginBottom: 24,
  },
  // "For" / "At" labels — small, gray, lowercase, normal weight
  coverPartyLabel: {
    fontSize: 9,
    color: "#999999",
    marginBottom: 4,
  },
  // Large org/client name — black, very large
  coverPartyOrgName: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginBottom: 6,
    lineHeight: 1.2,
  },
  // Contact name in blue
  coverPartyContact: {
    fontSize: 11,
    color: BLUE,
    marginBottom: 3,
  },
  // Small info lines (phone, email)
  coverPartyInfo: {
    fontSize: 9,
    color: "#444444",
    lineHeight: 1.5,
  },
  coverPartyInfoBlue: {
    fontSize: 9,
    color: BLUE,
    lineHeight: 1.5,
  },
  // Venue name in blue, large
  coverVenueName: {
    fontSize: 18,
    color: BLUE,
    marginBottom: 4,
    lineHeight: 1.3,
  },

  // ── Blue section headings ────────────────────────────────────────────────────
  sectionHeading: {
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: BLUE,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BLUE,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // ── Service sub-headings (under Technical Scope) ─────────────────────────────
  serviceSubHeading: {
    marginTop: 10,
    marginBottom: 4,
    paddingLeft: 8,
  },
  serviceSubTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // ── Client Will Provide (pink box) ───────────────────────────────────────────
  clientProvideBox: {
    backgroundColor: PINK_BG,
    padding: 12,
    marginBottom: 6,
  },
  clientProvideTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: PINK_TITLE,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  clientProvideRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  clientProvideNum: {
    fontSize: 9,
    color: "#333333",
    width: 16,
  },
  clientProvideText: {
    fontSize: 9,
    color: "#333333",
    lineHeight: 1.5,
    flex: 1,
  },
  clientProvideIndentRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 16,
  },
  clientProvideIndentLabel: {
    fontSize: 9,
    color: "#333333",
    width: 14,
  },
  clientProvideIndentText: {
    fontSize: 9,
    color: "#333333",
    lineHeight: 1.5,
    flex: 1,
  },

  // ── Bullet rows ──────────────────────────────────────────────────────────────
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 8,
  },
  bulletSymbol: {
    fontSize: 10,
    color: "#444444",
    marginRight: 6,
    width: 10,
  },
  bulletText: {
    fontSize: 9,
    color: "#333333",
    flex: 1,
    lineHeight: 1.45,
  },
  bulletTextBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    flex: 1,
  },
  subBulletRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 22,
  },
  subBulletSymbol: {
    fontSize: 8,
    color: "#666666",
    marginRight: 6,
    width: 10,
  },
  subBulletText: {
    fontSize: 9,
    color: "#444444",
    flex: 1,
    lineHeight: 1.4,
  },

  // ── Work plan ────────────────────────────────────────────────────────────────
  workPlanDateHeader: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    marginBottom: 5,
    marginTop: 4,
    paddingLeft: 8,
  },
  workPlanRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 8,
    alignItems: "flex-start",
  },
  workPlanDash: {
    fontSize: 9,
    color: "#555555",
    width: 12,
    marginTop: 1,
  },
  workPlanTime: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    width: 82,
    color: "#222222",
  },
  workPlanDesc: {
    fontSize: 9,
    color: "#444444",
    flex: 1,
    lineHeight: 1.45,
  },
  workPlanNote: {
    fontSize: 8,
    color: "#888888",
    fontFamily: "Helvetica-Oblique",
    paddingLeft: 8,
    marginTop: 5,
  },

  // ── Location section ─────────────────────────────────────────────────────────
  locationRow: {
    flexDirection: "row",
    marginBottom: 5,
    paddingLeft: 8,
    alignItems: "flex-start",
  },
  locationLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    width: 110,
    color: "#555555",
  },
  locationValue: {
    fontSize: 9,
    color: "#333333",
    flex: 1,
    lineHeight: 1.4,
  },

  // ── Financials table ─────────────────────────────────────────────────────────
  financialsTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#000000",
  },
  tableWrapper: {
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableSectionRow: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    paddingVertical: 5,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  tableSectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#444444",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    textAlign: "center",
  },
  tableDataRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eeeeee",
  },
  tableDataRowAlt: {
    backgroundColor: "#f9f9f9",
  },
  colName: { width: "28%" },
  colDesc: { width: "36%" },
  colUnits: { width: "10%", textAlign: "right" },
  colPrice: { width: "13%", textAlign: "right" },
  colSubtotal: { width: "13%", textAlign: "right" },
  cellName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    lineHeight: 1.4,
  },
  cellDesc: {
    fontSize: 8,
    color: "#555555",
    lineHeight: 1.4,
  },
  cellNum: {
    fontSize: 9,
    color: "#333333",
  },
  cellNumBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
  },

  // ── Total (plain bold text below table) ─────────────────────────────────────
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 2,
    borderTopColor: "#1a1a1a",
    marginTop: 2,
  },
  totalText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },

  // ── Estimate note box ────────────────────────────────────────────────────────
  noteBox: {
    borderWidth: 1,
    borderColor: "#dddddd",
    backgroundColor: "#fafafa",
    padding: 10,
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#333333",
  },
  noteText: {
    fontSize: 9,
    color: "#555555",
    lineHeight: 1.5,
  },

  // ── Terms ────────────────────────────────────────────────────────────────────
  termsPageTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#000000",
  },
  termsUpdated: {
    fontSize: 8,
    color: "#888888",
    marginBottom: 18,
  },
  termsSection: {
    marginBottom: 10,
  },
  termsSectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BLUE,
    marginBottom: 5,
  },
  termsSubARow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 12,
  },
  termsSubALabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    width: 18,
    color: "#333333",
  },
  termsSubAText: {
    fontSize: 9,
    color: "#444444",
    flex: 1,
    lineHeight: 1.55,
  },
  termsNumRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 28,
  },
  termsNumLabel: {
    fontSize: 8.5,
    width: 16,
    color: "#555555",
  },
  termsNumText: {
    fontSize: 8.5,
    color: "#555555",
    flex: 1,
    lineHeight: 1.5,
  },

  // ── Page footer ──────────────────────────────────────────────────────────────
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: MARGIN,
    right: MARGIN,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#dddddd",
    paddingTop: 5,
  },
  pageFooterText: {
    fontSize: 7.5,
    color: "#aaaaaa",
  },
});

// ─── sub-components ───────────────────────────────────────────────────────────

function BulletRow({ text, bold }: { text: string; bold?: boolean }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletSymbol}>○</Text>
      <Text style={bold ? s.bulletTextBold : s.bulletText}>{text}</Text>
    </View>
  );
}

function SubBulletRow({ text }: { text: string }) {
  return (
    <View style={s.subBulletRow}>
      <Text style={s.subBulletSymbol}>■</Text>
      <Text style={s.subBulletText}>{text}</Text>
    </View>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <View style={s.sectionHeading}>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

function ServiceSubHeading({ title }: { title: string }) {
  return (
    <View style={s.serviceSubHeading}>
      <Text style={s.serviceSubTitle}>{title}</Text>
    </View>
  );
}

function PageFooter({ refNum, version }: { refNum: string; version: string }) {
  return (
    <View style={s.pageFooter} fixed>
      <Text style={s.pageFooterText}>{refNum}</Text>
      <Text style={s.pageFooterText}>{version}</Text>
    </View>
  );
}

// ─── main document ────────────────────────────────────────────────────────────

interface QuoteDocumentProps {
  data: QuoteFormData;
  items: LineItem[];
  subtotal: number;
}

export function QuoteDocument({ data, items, subtotal }: QuoteDocumentProps) {
  const now = new Date();
  const versionDate = now
    .toLocaleDateString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, ".");
  const fullDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const refNum = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
  const versionLabel = `${versionDate} Version`;

  const eventName = data.eventName ?? "Untitled Event";
  const venueName = data.venueName ?? "TBD";
  const clientName = data.clientName ?? "TBD";
  const clientPhone = data.clientPhone ?? "";
  const org = data.organization ?? "";
  const eventDate =
    data.hasDate && data.eventDate ? formatDate(data.eventDate) : "TBD";
  const duration = data.hasDuration ? `${data.durationHours} hours` : "TBD";
  const setting = data.setting === "outdoor" ? "Outdoor" : "Indoor";

  const hasStreaming = data.services?.includes("streaming") ?? false;
  const hasVideo = data.services?.includes("video") ?? false;
  const hasPA = data.audioServices?.includes("pa") ?? false;
  const activeVideoTypes = hasVideo ? (data.videoTypes ?? []) : [];

  const servicesLine =
    [
      hasStreaming ? "Live Streaming" : null,
      hasVideo ? "Video Production" : null,
      hasPA ? "Audio / PA" : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Production Estimate";

  const workPlan = computeWorkPlan(data);

  // ── group line items by category ─────────────────────────────────────────────
  const laborItems = items.filter(
    (i) =>
      i.unit === "hrs" ||
      i.unit === "flat" ||
      i.description.toLowerCase().includes("tech") ||
      i.name.toLowerCase().includes("tech") ||
      i.name.toLowerCase().includes("lead") ||
      i.name.toLowerCase().includes("operator"),
  );
  const equipItems = items.filter(
    (i) =>
      !laborItems.includes(i) &&
      (i.unit === "set" ||
        i.unit === "day" ||
        i.unit === "kit" ||
        i.unit === "pack" ||
        i.unit === "unit" ||
        i.unit === "service"),
  );
  const postItems = items.filter(
    (i) =>
      !laborItems.includes(i) &&
      !equipItems.includes(i) &&
      (i.unit === "edit" ||
        i.unit === "talk" ||
        i.unit === "short" ||
        i.unit === "slot" ||
        i.description.toLowerCase().includes("edit")),
  );
  const otherItems = items.filter(
    (i) =>
      !laborItems.includes(i) &&
      !equipItems.includes(i) &&
      !postItems.includes(i),
  );

  // ── built-in AV items (excluding "not-sure") ─────────────────────────────────
  const builtInAVList = (data.builtInAV ?? []).filter((x) => x !== "not-sure");
  const hasSiteVisit = data.builtInAV?.includes("not-sure") ?? false;

  // ── streaming sub-letter index for Client Will Provide ───────────────────────
  let clientProvideSubIndex = 0;
  const nextSubLabel = () => {
    const labels = ["a", "b", "c", "d", "e"];
    return labels[clientProvideSubIndex++] + ".";
  };

  return (
    <Document
      title={`Production Estimate — ${eventName}`}
      author="The Recording Service LLC"
    >
      {/* ════════════════════════════════════════════════════════════════
          PAGE 1 — COVER
      ════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        {/* Version top-left */}
        <Text style={s.coverVersionLine}>{versionLabel}</Text>

        {/* Date — prominent, above event name */}
        <Text style={s.coverDate}>{fullDate}</Text>

        {/* Event name */}
        <Text style={s.coverEventName}>{eventName}</Text>

        {/* Services summary */}
        <Text style={s.coverServicesLine}>{servicesLine}</Text>

        {/* For */}
        <View style={s.coverPartyBlock}>
          <Text style={s.coverPartyLabel}>For</Text>
          {!data.isSpecQuote ? (
            <>
              {/* Org name is the large primary entity; clientName is the contact */}
              {org ? (
                <>
                  <Text style={s.coverPartyOrgName}>{org}</Text>
                  <Text style={s.coverPartyContact}>Contact: {clientName}</Text>
                </>
              ) : (
                <Text style={s.coverPartyOrgName}>{clientName}</Text>
              )}
              {clientPhone ? (
                <Text style={s.coverPartyInfo}>{clientPhone}</Text>
              ) : null}
              {data.deliveryEmail ? (
                <Text style={s.coverPartyInfoBlue}>{data.deliveryEmail}</Text>
              ) : null}
            </>
          ) : (
            <Text style={s.coverPartyInfo}>(Spec Quote)</Text>
          )}
        </View>

        {/* At */}
        <View style={s.coverPartyBlock}>
          <Text style={s.coverPartyLabel}>At</Text>
          <Text style={s.coverVenueName}>{venueName}</Text>
          <Text style={s.coverPartyInfo}>{setting}</Text>
          <Text style={s.coverPartyInfo}>Event Date: {eventDate}</Text>
          <Text style={s.coverPartyInfo}>Duration: {duration}</Text>
        </View>

        {/* To Be Produced By */}
        <View style={s.coverPartyBlock}>
          <Text style={s.coverPartyLabel}>To Be Produced By</Text>
          <Text style={s.coverVenueName}>The Recording Service LLC</Text>
          <Text style={s.coverPartyInfo}>contact@therecordingservice.com</Text>
          <Text style={s.coverPartyInfo}>770-696-3139</Text>
        </View>

        {/* Ref bottom-right */}
        <Text style={s.coverRefLine}>{refNum}</Text>
      </Page>

      {/* ════════════════════════════════════════════════════════════════
          PAGE 2+ — SCOPE / WORK PLAN / LOCATION
      ════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        {/* ── Client Will Provide (pink box) ─────────────────────────── */}
        <View style={s.clientProvideBox}>
          <Text style={s.clientProvideTitle}>
            *** Client Will Provide The Following ***
          </Text>
          <View style={s.clientProvideRow}>
            <Text style={s.clientProvideNum}>1.</Text>
            <Text style={s.clientProvideText}>
              Please provide three (3) days before the production:
            </Text>
          </View>
          {(() => {
            clientProvideSubIndex = 0;
            return null;
          })()}
          <View style={s.clientProvideIndentRow}>
            <Text style={s.clientProvideIndentLabel}>{nextSubLabel()}</Text>
            <Text style={s.clientProvideIndentText}>
              Run of Show document detailing the program
            </Text>
          </View>
          {builtInAVList.length > 0 && (
            <View style={s.clientProvideIndentRow}>
              <Text style={s.clientProvideIndentLabel}>{nextSubLabel()}</Text>
              <Text style={s.clientProvideIndentText}>
                Access to venue's built-in AV: {builtInAVList.join(", ")}
              </Text>
            </View>
          )}
          {hasStreaming && (
            <View style={s.clientProvideIndentRow}>
              <Text style={s.clientProvideIndentLabel}>{nextSubLabel()}</Text>
              <Text style={s.clientProvideIndentText}>
                Internet upload speed of at least 15 mb/s per streaming platform
              </Text>
            </View>
          )}
          {hasSiteVisit && (
            <View style={s.clientProvideIndentRow}>
              <Text style={s.clientProvideIndentLabel}>{nextSubLabel()}</Text>
              <Text style={s.clientProvideIndentText}>
                Venue access for site visit — Producer will evaluate built-in AV
                and apply discounts accordingly
              </Text>
            </View>
          )}
        </View>

        {/* ── Technical Scope ────────────────────────────────────────── */}
        <SectionHeading title="Technical Scope" />

        {hasStreaming && (
          <>
            <ServiceSubHeading title="Live Streaming" />
            <BulletRow
              text="STREAM KIT: Encoder, switcher, and stream control system"
              bold
            />
            {!data.isZoomOnly && (
              <>
                <BulletRow
                  text={`CAMERA SETUP: ${data.cameraCount ?? "1"} camera(s) — ${data.cameraSource === "built-in" ? "using venue built-in cameras" : "camcorder kit(s)"}`}
                />
                {data.streamGraphics && (
                  <BulletRow text="STREAM GRAPHICS: On-screen overlays and branding prepared" />
                )}
                {!data.diyStream && (
                  <BulletRow text="STREAM LINK SETUP: Destination platform configured by our tech" />
                )}
              </>
            )}
            {data.isZoomOnly && (
              <BulletRow text="Using all venue built-in AV to stream to Zoom only" />
            )}
          </>
        )}

        {hasVideo && (
          <>
            <ServiceSubHeading title="Video Production" />
            {activeVideoTypes.includes("podcast") && (
              <>
                <BulletRow text="VIDEO PODCAST" bold />
                <SubBulletRow text="2x Mirrorless camera kit + Studio lighting kit" />
                <SubBulletRow text="Production Lead + Lighting Technician" />
                <SubBulletRow
                  text={`${data.podcastEpisodes ?? 1} episode(s) — ${data.podcastDuration ?? 1} hr recording session each`}
                />
                <SubBulletRow text="Guests should arrive at least 15 minutes before filming to be mic'd up" />
              </>
            )}
            {activeVideoTypes.includes("web-video") && (
              <>
                <BulletRow text="WEB VIDEO" bold />
                <SubBulletRow text="Mirrorless camera kit + Studio lighting kit" />
                <SubBulletRow
                  text={`${data.webVideoPeople ?? 1} person(s) filmed — ${data.webVideoCount ?? 1} video(s) produced — up to ${data.webVideoDuration ?? 3} min each`}
                />
                <SubBulletRow text="Guests should arrive at least 15 minutes before filming to be mic'd up" />
              </>
            )}
            {activeVideoTypes.includes("highlight") && (
              <>
                <BulletRow text="EVENT HIGHLIGHT" bold />
                <SubBulletRow text="Mirrorless camera kit — in 30 min, out 30 min" />
                <SubBulletRow
                  text={`Recording duration: ${data.highlightDurationHours ?? 4} hr(s) — ${(data.highlightDurationHours ?? 4) < 4 ? "Half Day Rate" : "Full Day Rate"}`}
                />
                <SubBulletRow text="Delivered as a creative highlight reel" />
              </>
            )}
            {activeVideoTypes.includes("lecture") && (
              <>
                <BulletRow text="LECTURE OR PANEL DISCUSSION" bold />
                <SubBulletRow text="Camcorder kit + AV essential kit" />
                <SubBulletRow
                  text={`${data.lectureTalksCount ?? 1} talk(s) — ${data.lectureTalkDuration ?? "up to 1hr"} each`}
                />
                {data.lecturePPT && (
                  <SubBulletRow text="Includes PowerPoint slide recording and integration" />
                )}
                {data.additionalAngles && (data.angleCount ?? 0) > 0 && (
                  <SubBulletRow
                    text={`${data.angleCount} additional camera angle(s)`}
                  />
                )}
                <SubBulletRow text="STANDARD VIDEO EDIT: Audio touch-ups, subtitles (.srt), lower thirds, intro/outro screens" />
              </>
            )}
          </>
        )}

        {hasPA && (
          <>
            <ServiceSubHeading title="Audio / Public Address" />
            <BulletRow
              text={`${data.setting === "outdoor" ? "OUTDOOR" : "INDOOR"} AUDIO KIT: Full PA system`}
              bold
            />
            {!data.builtInAV?.includes("audio") && (
              <>
                {(data.micWirelessHandheld ?? 0) > 0 && (
                  <SubBulletRow
                    text={`Wireless Handheld Mic ×${data.micWirelessHandheld}`}
                  />
                )}
                {(data.micWirelessLav ?? 0) > 0 && (
                  <SubBulletRow
                    text={`Wireless Lav Mic ×${data.micWirelessLav}`}
                  />
                )}
                {(data.micWiredSM58 ?? 0) > 0 && (
                  <SubBulletRow text={`Wired SM58 ×${data.micWiredSM58}`} />
                )}
                {(data.micWiredGooseneck ?? 0) > 0 && (
                  <SubBulletRow
                    text={`Wired Gooseneck ×${data.micWiredGooseneck}`}
                  />
                )}
                {data.micNotSure && (
                  <SubBulletRow text="Mic quantity TBD — Producer will follow up" />
                )}
              </>
            )}
            {data.builtInAV?.includes("audio") && (
              <SubBulletRow text="Using venue built-in sound system" />
            )}
            {data.vogEnabled && (
              <SubBulletRow
                text={`Voice of God mic — ${data.vogAnnouncer === "tech" ? "announced by our audio tech" : "announced by client team"}`}
              />
            )}
            {data.monitorsEnabled && (data.monitors ?? 0) > 0 && (
              <SubBulletRow text={`Stage monitor wedges ×${data.monitors}`} />
            )}
            {(data.attendance ?? 0) > 0 && (
              <SubBulletRow
                text={`Expected attendance: ${data.attendance} — speaker count calculated accordingly`}
              />
            )}
          </>
        )}

        {/* ── Work Plan ──────────────────────────────────────────────── */}
        {workPlan.rows.length > 0 && (
          <>
            <SectionHeading title="Work Plan" />
            {workPlan.dateHeader ? (
              <Text style={s.workPlanDateHeader}>{workPlan.dateHeader}</Text>
            ) : null}
            {workPlan.rows.map((row, i) => (
              <View key={i} style={s.workPlanRow}>
                <Text style={s.workPlanDash}>-</Text>
                <Text style={s.workPlanTime}>{row.time}</Text>
                <Text style={s.workPlanDesc}>{row.description}</Text>
              </View>
            ))}
            {workPlan.usedDefaultTime && (
              <Text style={s.workPlanNote}>
                * Times are approximate — based on an assumed 12:00 PM show
                start. Your Production Lead will confirm the final schedule.
              </Text>
            )}
          </>
        )}

        {/* ── Rain Plan ──────────────────────────────────────────────── */}
        <SectionHeading title="Rain Plan" />
        <BulletRow
          text={
            data.setting === "outdoor"
              ? "TBD — your Production Lead will discuss a rain contingency plan before your event."
              : "N/A"
          }
        />

        {/* ── Location ───────────────────────────────────────────────── */}
        <SectionHeading title="Location" />
        <View style={s.locationRow}>
          <Text style={s.locationLabel}>Venue</Text>
          <Text style={s.locationValue}>{venueName}</Text>
        </View>
        <View style={s.locationRow}>
          <Text style={s.locationLabel}>Setting</Text>
          <Text style={s.locationValue}>{setting}</Text>
        </View>
        <View style={s.locationRow}>
          <Text style={s.locationLabel}>Event Date</Text>
          <Text style={s.locationValue}>{eventDate}</Text>
        </View>
        <View style={s.locationRow}>
          <Text style={s.locationLabel}>Duration</Text>
          <Text style={s.locationValue}>{duration}</Text>
        </View>
        {builtInAVList.length > 0 && (
          <View style={s.locationRow}>
            <Text style={s.locationLabel}>Built-in AV Available</Text>
            <Text style={s.locationValue}>{builtInAVList.join(", ")}</Text>
          </View>
        )}
        {hasSiteVisit && (
          <View style={s.locationRow}>
            <Text style={s.locationLabel}>AV Assessment</Text>
            <Text style={s.locationValue}>
              Site visit requested — Producer will evaluate and apply discounts
              accordingly
            </Text>
          </View>
        )}

        <PageFooter refNum={refNum} version={versionLabel} />
      </Page>

      {/* ════════════════════════════════════════════════════════════════
          FINANCIALS PAGE
      ════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Text style={s.financialsTitle}>Detailed Financials</Text>

        <View style={s.tableWrapper}>
          {/* Table header row */}
          <View style={s.tableHeaderRow}>
            <Text style={[s.tableHeaderCell, s.colName]}>Item Name</Text>
            <Text style={[s.tableHeaderCell, s.colDesc]}>Item Description</Text>
            <Text style={[s.tableHeaderCell, s.colUnits]}>Units</Text>
            <Text style={[s.tableHeaderCell, s.colPrice]}>Price / Unit</Text>
            <Text style={[s.tableHeaderCell, s.colSubtotal]}>Subtotal</Text>
          </View>

          {/* Labor */}
          {laborItems.length > 0 && (
            <>
              <View style={s.tableSectionRow}>
                <Text style={s.tableSectionLabel}>Labor</Text>
              </View>
              {laborItems.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    s.tableDataRow,
                    idx % 2 !== 0 ? s.tableDataRowAlt : {},
                  ]}
                  wrap={false}
                >
                  <View style={s.colName}>
                    <Text style={s.cellName}>{item.name}</Text>
                  </View>
                  <View style={s.colDesc}>
                    <Text style={s.cellDesc}>{item.description}</Text>
                  </View>
                  <Text style={[s.cellNum, s.colUnits]}>
                    {item.quantity} {item.unit}
                  </Text>
                  <Text style={[s.cellNum, s.colPrice]}>{fmt(item.rate)}</Text>
                  <Text style={[s.cellNumBold, s.colSubtotal]}>
                    {fmt(item.total)}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Equipment */}
          {equipItems.length > 0 && (
            <>
              <View style={s.tableSectionRow}>
                <Text style={s.tableSectionLabel}>Equipment</Text>
              </View>
              {equipItems.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    s.tableDataRow,
                    idx % 2 !== 0 ? s.tableDataRowAlt : {},
                  ]}
                  wrap={false}
                >
                  <View style={s.colName}>
                    <Text style={s.cellName}>{item.name}</Text>
                  </View>
                  <View style={s.colDesc}>
                    <Text style={s.cellDesc}>{item.description}</Text>
                  </View>
                  <Text style={[s.cellNum, s.colUnits]}>
                    {item.quantity} {item.unit}
                  </Text>
                  <Text style={[s.cellNum, s.colPrice]}>{fmt(item.rate)}</Text>
                  <Text style={[s.cellNumBold, s.colSubtotal]}>
                    {fmt(item.total)}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Post-Production */}
          {postItems.length > 0 && (
            <>
              <View style={s.tableSectionRow}>
                <Text style={s.tableSectionLabel}>Post-Production</Text>
              </View>
              {postItems.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    s.tableDataRow,
                    idx % 2 !== 0 ? s.tableDataRowAlt : {},
                  ]}
                  wrap={false}
                >
                  <View style={s.colName}>
                    <Text style={s.cellName}>{item.name}</Text>
                  </View>
                  <View style={s.colDesc}>
                    <Text style={s.cellDesc}>{item.description}</Text>
                  </View>
                  <Text style={[s.cellNum, s.colUnits]}>
                    {item.quantity} {item.unit}
                  </Text>
                  <Text style={[s.cellNum, s.colPrice]}>{fmt(item.rate)}</Text>
                  <Text style={[s.cellNumBold, s.colSubtotal]}>
                    {fmt(item.total)}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Other */}
          {otherItems.length > 0 && (
            <>
              <View style={s.tableSectionRow}>
                <Text style={s.tableSectionLabel}>Other</Text>
              </View>
              {otherItems.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    s.tableDataRow,
                    idx % 2 !== 0 ? s.tableDataRowAlt : {},
                  ]}
                  wrap={false}
                >
                  <View style={s.colName}>
                    <Text style={s.cellName}>{item.name}</Text>
                  </View>
                  <View style={s.colDesc}>
                    <Text style={s.cellDesc}>{item.description}</Text>
                  </View>
                  <Text style={[s.cellNum, s.colUnits]}>
                    {item.quantity} {item.unit}
                  </Text>
                  <Text style={[s.cellNum, s.colPrice]}>{fmt(item.rate)}</Text>
                  <Text style={[s.cellNumBold, s.colSubtotal]}>
                    {fmt(item.total)}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Total — plain bold text below table (not a dark row) */}
          <View style={s.totalRow}>
            <Text style={s.totalText}>Total: {fmt(subtotal)}</Text>
          </View>
        </View>

        {/* Estimate note */}
        <View style={[s.noteBox, { marginTop: 16 }]}>
          <Text style={s.noteTitle}>This is an Estimate</Text>
          <Text style={s.noteText}>
            This is the price of the tech scope we have discussed so far. If the
            scope or deliverables change, the final price will be different.
            Your Production Lead will discuss with you about anything that would
            affect the final price (e.g., extra microphones, the show running
            late, etc).
          </Text>
        </View>

        <PageFooter refNum={refNum} version={versionLabel} />
      </Page>

      {/* ════════════════════════════════════════════════════════════════
          TERMS & CONDITIONS PAGE
      ════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Text style={s.termsPageTitle}>Terms and Conditions</Text>
        <Text style={s.termsUpdated}>Last updated: April 1, 2024</Text>

        {/* I. Rush Fee */}
        <View style={s.termsSection} wrap={false}>
          <Text style={s.termsSectionTitle}>I. Rush Fee</Text>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>A.</Text>
            <Text style={s.termsSubAText}>
              A rush fee not to exceed 20% of the quote shall apply to any
              events requested with less than two (2) full business days'
              notice (16 business hours).
            </Text>
          </View>
        </View>

        {/* II. Cancellation Fee */}
        <View style={s.termsSection} wrap={false}>
          <Text style={s.termsSectionTitle}>II. Cancellation Fee</Text>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>A.</Text>
            <Text style={s.termsSubAText}>30–6 Days Before Event:</Text>
          </View>
          <View style={s.termsNumRow}>
            <Text style={s.termsNumLabel}>1.</Text>
            <Text style={s.termsNumText}>
              Pre-Production: Fully billed for work completed to date
            </Text>
          </View>
          <View style={s.termsNumRow}>
            <Text style={s.termsNumLabel}>2.</Text>
            <Text style={s.termsNumText}>Production Labor: 50% charge</Text>
          </View>
          <View style={s.termsNumRow}>
            <Text style={s.termsNumLabel}>3.</Text>
            <Text style={s.termsNumText}>Equipment: 25% of quoted cost</Text>
          </View>
          <View style={s.termsNumRow}>
            <Text style={s.termsNumLabel}>4.</Text>
            <Text style={s.termsNumText}>Post-Production: No charge</Text>
          </View>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>B.</Text>
            <Text style={s.termsSubAText}>5–1 Day Before Event:</Text>
          </View>
          <View style={s.termsNumRow}>
            <Text style={s.termsNumLabel}>1.</Text>
            <Text style={s.termsNumText}>
              Production Labor: 50% charge for all labor
            </Text>
          </View>
          <View style={s.termsNumRow}>
            <Text style={s.termsNumLabel}>2.</Text>
            <Text style={s.termsNumText}>Equipment: 50% of quoted cost</Text>
          </View>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>C.</Text>
            <Text style={s.termsSubAText}>Less than 24 Hours:</Text>
          </View>
          <View style={s.termsNumRow}>
            <Text style={s.termsNumLabel}>1.</Text>
            <Text style={s.termsNumText}>
              Production Labor: Fully billed
            </Text>
          </View>
          <View style={s.termsNumRow}>
            <Text style={s.termsNumLabel}>2.</Text>
            <Text style={s.termsNumText}>Equipment: Fully billed</Text>
          </View>
          <View style={s.termsNumRow}>
            <Text style={s.termsNumLabel}>3.</Text>
            <Text style={s.termsNumText}>Post-Production: No charge</Text>
          </View>
        </View>

        {/* III. Edited Video Reviews and Revisions */}
        <View style={s.termsSection} wrap={false}>
          <Text style={s.termsSectionTitle}>
            III. Edited Video Reviews and Revisions
          </Text>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>A.</Text>
            <Text style={s.termsSubAText}>
              Clients have 60 days from the date of delivery to review and
              submit feedback.
            </Text>
          </View>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>B.</Text>
            <Text style={s.termsSubAText}>
              Once feedback is received, a revised version will be completed
              and delivered within 2 business days.
            </Text>
          </View>
        </View>

        {/* IV. PowerPoint Presentation */}
        <View style={s.termsSection} wrap={false}>
          <Text style={s.termsSectionTitle}>IV. PowerPoint Presentation</Text>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>A.</Text>
            <Text style={s.termsSubAText}>
              PPTs must be submitted at least 3 days prior to the event.
            </Text>
          </View>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>B.</Text>
            <Text style={s.termsSubAText}>
              Discounts or refunds will not be issued for issues related to
              PPTs not delivered within this timeframe.
            </Text>
          </View>
        </View>

        {/* V. This is an Estimate */}
        <View style={s.termsSection} wrap={false}>
          <Text style={s.termsSectionTitle}>V. This is an Estimate</Text>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>A.</Text>
            <Text style={s.termsSubAText}>
              This document represents the price of the technical scope
              discussed to date.
            </Text>
          </View>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>B.</Text>
            <Text style={s.termsSubAText}>
              If the scope or deliverables change, the final price will differ.
            </Text>
          </View>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>C.</Text>
            <Text style={s.termsSubAText}>
              Your Production Lead will discuss anything that would affect the
              final price (e.g., extra microphones, the show running late).
            </Text>
          </View>
        </View>

        {/* VI. Deposit Requirement */}
        <View style={s.termsSection} wrap={false}>
          <Text style={s.termsSectionTitle}>
            VI. Deposit Requirement for Projects Exceeding $10,000
          </Text>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>A.</Text>
            <Text style={s.termsSubAText}>
              For projects valued over $10,000, a 50% deposit is required.
            </Text>
          </View>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>B.</Text>
            <Text style={s.termsSubAText}>
              This deposit must be paid 14 days before the first day of your
              show.
            </Text>
          </View>
        </View>

        {/* VII. Video Editing Billing */}
        <View style={s.termsSection} wrap={false}>
          <Text style={s.termsSectionTitle}>VII. Video Editing Billing</Text>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>A.</Text>
            <Text style={s.termsSubAText}>
              For projects with video editing, billing is split into
              "Production Day" and "Video Editing" expenses.
            </Text>
          </View>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>B.</Text>
            <Text style={s.termsSubAText}>
              Filming production costs are included in the second invoice,
              except if TRS Tech delivers raw footage immediately after filming.
            </Text>
          </View>
        </View>

        {/* VIII. Holidays */}
        <View style={s.termsSection} wrap={false}>
          <Text style={s.termsSectionTitle}>VIII. Holidays</Text>
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>A.</Text>
            <Text style={s.termsSubAText}>
              The following holidays are billed at 1.5× labor rate:
            </Text>
          </View>
          {[
            "New Year's Day",
            "Memorial Day",
            "Independence Day (July 4th)",
            "Labor Day",
            "Black Friday",
            "New Year's Eve (after 12 PM)",
          ].map((h, i) => (
            <View key={i} style={s.termsNumRow}>
              <Text style={s.termsNumLabel}>{i + 1}.</Text>
              <Text style={s.termsNumText}>{h}</Text>
            </View>
          ))}
          <View style={s.termsSubARow}>
            <Text style={s.termsSubALabel}>B.</Text>
            <Text style={s.termsSubAText}>
              The following holidays are billed at 2× labor rate:
            </Text>
          </View>
          {["Thanksgiving", "Christmas Eve", "Christmas Day"].map((h, i) => (
            <View key={i} style={s.termsNumRow}>
              <Text style={s.termsNumLabel}>{i + 1}.</Text>
              <Text style={s.termsNumText}>{h}</Text>
            </View>
          ))}
        </View>

        <PageFooter refNum={refNum} version={versionLabel} />
      </Page>
    </Document>
  );
}
