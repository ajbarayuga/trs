import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { QUOTE_BODY, QUOTE_DISPLAY } from "@/components/pdf/quotePdfFonts";
import type { QuoteFormData } from "@/schema/quote";
import type { LineItem } from "@/lib/calculateSOW";
import { computeWorkPlan } from "@/lib/calculateWorkPlan";
import { groupLineItems } from "@/lib/quoteLineItemGroups";
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

// ─── design tokens (Jones Room reference: Arial + Proxima Nova; see quotePdfFonts) ─

const MARGIN = 54;
const BLUE = "#1155CC";
/** Cover — Jones Room proposal reference (sizes / colors / placement) */
const COVER_MARGIN = 72;
const COVER_ACCENT = "#6495ED";
const COVER_LABEL = "#666666";
const COVER_VERSION_REF = "#999999";
/** Reference Detailed Financials: 1px black rules, light gray section bands */
const TABLE_BORDER = "#000000";
const TABLE_SECTION_BG = "#D3D3D3";
/** Client Will Provide header bar (reference: light pink band behind title) */
const CLIENT_PROVIDE_HEADER_BG = "#FADBD8";
/** Section titles (reference: bold medium blue, no rule/underline) */
const SECTION_TITLE_BLUE = "#4A90E2";

// ─── styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  pageCover: {
    backgroundColor: "#ffffff",
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    fontSize: 10,
    color: "#000000",
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: COVER_MARGIN,
    flexDirection: "column",
    height: "100%",
  },
  pageInner: {
    backgroundColor: "#ffffff",
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    fontSize: 11,
    color: "#000000",
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: MARGIN,
  },

  // ── Cover page (Jones Room ref: centered hero, left body, producer lower) ───
  coverVersionTopLeft: {
    position: "absolute",
    top: 32,
    left: COVER_MARGIN,
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: COVER_VERSION_REF,
  },
  coverHeroWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 48,
  },
  coverHeroDate: {
    width: "100%",
    textAlign: "center",
    fontSize: 17,
    fontFamily: QUOTE_DISPLAY,
    fontWeight: 700,
    color: "#000000",
    marginBottom: 6,
  },
  coverHeroTitle: {
    width: "100%",
    textAlign: "center",
    fontSize: 30,
    fontFamily: QUOTE_DISPLAY,
    fontWeight: 700,
    color: "#000000",
    lineHeight: 1.12,
    marginBottom: 0,
  },
  coverHeroSubtitle: {
    width: "100%",
    textAlign: "center",
    fontSize: 23,
    fontFamily: QUOTE_DISPLAY,
    fontWeight: 400,
    color: "#000000",
    marginTop: 44,
    lineHeight: 1.2,
  },
  coverLeftBlock: {
    width: "100%",
    marginBottom: 34,
  },
  coverSectionLabel: {
    fontSize: 10.5,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: COVER_LABEL,
    marginBottom: 5,
    textAlign: "left",
  },
  coverEntityLine: {
    fontSize: 21,
    fontFamily: QUOTE_DISPLAY,
    fontWeight: 700,
    color: "#000000",
    lineHeight: 1.18,
    marginBottom: 1,
    textAlign: "left",
  },
  coverContactLine: {
    fontSize: 15,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: COVER_ACCENT,
    marginTop: 10,
    marginBottom: 5,
    textAlign: "left",
  },
  coverPhoneSmall: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: COVER_LABEL,
    marginBottom: 3,
    textAlign: "left",
  },
  coverEmailSmall: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: COVER_ACCENT,
    textDecoration: "underline",
    textAlign: "left",
  },
  coverVenueTitle: {
    fontSize: 15,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: COVER_ACCENT,
    marginBottom: 5,
    lineHeight: 1.3,
    textAlign: "left",
  },
  coverVenueDetail: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: COVER_LABEL,
    lineHeight: 1.45,
    marginBottom: 2,
    textAlign: "left",
  },
  coverProducerCompany: {
    fontSize: 21,
    fontFamily: QUOTE_DISPLAY,
    fontWeight: 700,
    color: "#000000",
    marginBottom: 6,
    lineHeight: 1.15,
    textAlign: "left",
  },
  coverProducerName: {
    fontSize: 15,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: COVER_ACCENT,
    marginBottom: 5,
    textAlign: "left",
  },
  coverProducerBlock: {
    width: "100%",
    marginBottom: 20,
  },
  coverSpacer: {
    flexGrow: 1,
    minHeight: 48,
  },
  coverSpecNote: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: COVER_LABEL,
    fontStyle: "italic",
    textAlign: "left",
  },
  coverFooterRef: {
    position: "absolute",
    bottom: 32,
    left: COVER_MARGIN,
    right: COVER_MARGIN,
  },
  coverRefNumber: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: COVER_VERSION_REF,
    textAlign: "right",
  },

  // ── Section headings (reference: blue caps, no underline; breathable margins) ─
  sectionHeading: {
    marginTop: 18,
    marginBottom: 10,
    paddingBottom: 0,
    alignSelf: "flex-start",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    color: SECTION_TITLE_BLUE,
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },

  // ── Service sub-headings (under Technical Scope) ─────────────────────────────
  serviceSubHeading: {
    marginTop: 10,
    marginBottom: 4,
    paddingLeft: 8,
    alignSelf: "flex-start",
  },
  serviceSubTitle: {
    fontSize: 10.5,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    color: SECTION_TITLE_BLUE,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },

  // ── Client Will Provide (reference: pink header bar + 11–12pt list) ───────────
  // Note: do NOT set alignItems:flex-start on the outer box — it shrinks every
  // child to intrinsic width and squeezes the list into a narrow column.
  clientProvideBox: {
    marginBottom: 12,
  },
  clientProvideTitleBar: {
    alignSelf: "flex-start",
    backgroundColor: CLIENT_PROVIDE_HEADER_BG,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  clientProvideTitle: {
    fontSize: 17,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    color: "#1A1A1A",
    letterSpacing: 0.12,
    textAlign: "left",
  },
  clientProvideRow: {
    flexDirection: "row",
    marginBottom: 5,
    paddingLeft: 4,
  },
  clientProvideNum: {
    fontSize: 11.5,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    width: 18,
  },
  clientProvideText: {
    fontSize: 11.5,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    lineHeight: 1.38,
    flex: 1,
  },
  clientProvideIndentRow: {
    flexDirection: "row",
    marginBottom: 5,
    paddingLeft: 20,
  },
  clientProvideIndentLabel: {
    fontSize: 11.5,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    width: 16,
  },
  clientProvideIndentText: {
    fontSize: 11.5,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    lineHeight: 1.38,
    flex: 1,
  },
  clientProvideBold: {
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
  },

  // ── Bullet rows ──────────────────────────────────────────────────────────────
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 8,
  },
  bulletSymbol: {
    fontSize: 11,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    marginRight: 6,
    width: 10,
  },
  bulletText: {
    fontSize: 11,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    flex: 1,
    lineHeight: 1.45,
  },
  bulletTextBold: {
    fontSize: 11,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    color: "#000000",
    flex: 1,
  },
  subBulletRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 22,
  },
  subBulletSymbol: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#555555",
    marginRight: 6,
    width: 10,
  },
  subBulletText: {
    fontSize: 11,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    flex: 1,
    lineHeight: 1.45,
  },

  // ── Work plan ────────────────────────────────────────────────────────────────
  workPlanDateHeader: {
    fontSize: 11,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    color: SECTION_TITLE_BLUE,
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
    fontSize: 11,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#555555",
    width: 12,
    marginTop: 1,
  },
  workPlanTime: {
    fontSize: 11,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    width: 82,
    color: "#000000",
  },
  workPlanDesc: {
    fontSize: 11,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    flex: 1,
    lineHeight: 1.45,
  },
  workPlanNote: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    fontStyle: "italic",
    color: "#555555",
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
    fontSize: 11,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    width: 110,
    color: "#000000",
  },
  locationValue: {
    fontSize: 11,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    flex: 1,
    lineHeight: 1.45,
  },

  // ── Financials table (reference: black grid, gray section rows, white body) ─
  financialsTitle: {
    fontSize: 25,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 4,
    color: SECTION_TITLE_BLUE,
    letterSpacing: 0.2,
  },
  tableWrapper: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: TABLE_BORDER,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: TABLE_BORDER,
  },
  tableHeadCol: {
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: TABLE_BORDER,
  },
  tableHeadColEnd: {
    borderRightWidth: 0,
  },
  tableHeadColNumeric: {
    alignItems: "center",
  },
  tableHeaderCell: {
    fontSize: 10.5,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    color: "#000000",
    textAlign: "center",
  },
  tableSectionRow: {
    flexDirection: "row",
    backgroundColor: TABLE_SECTION_BG,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: TABLE_BORDER,
  },
  tableSectionLabel: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 0.35,
    textAlign: "center",
  },
  tableSubSectionRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: TABLE_BORDER,
  },
  tableSubSectionLabel: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  tableDataRow: {
    flexDirection: "row",
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: TABLE_BORDER,
  },
  tableBodyCol: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: TABLE_BORDER,
  },
  tableBodyColName: {
    justifyContent: "center",
    alignItems: "center",
  },
  tableBodyColDesc: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  tableBodyColNumeric: {
    alignItems: "center",
    justifyContent: "center",
  },
  colName: { width: "22%" },
  colDesc: { width: "42%" },
  colUnits: { width: "10%" },
  colPrice: { width: "13%" },
  colSubtotal: { width: "13%", borderRightWidth: 0 },
  cellName: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    color: "#000000",
    lineHeight: 1.35,
    textAlign: "center",
  },
  cellDesc: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    lineHeight: 1.45,
    textAlign: "left",
  },
  cellNum: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    textAlign: "center",
    width: "100%",
  },
  cellNumBold: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    color: "#000000",
    textAlign: "center",
    width: "100%",
  },

  // ── Total (reference: left-aligned below grid, large bold) ─────────────────
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 6,
    backgroundColor: "#FFFFFF",
  },
  totalText: {
    fontSize: 19,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
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
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    marginBottom: 4,
    color: SECTION_TITLE_BLUE,
  },
  noteText: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#333333",
    lineHeight: 1.5,
  },

  // ── Terms page header (reference: centered, both lines black, no underline) ─
  termsPageHeader: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  termsPageTitle: {
    width: "100%",
    textAlign: "center",
    fontSize: 18,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    marginBottom: 6,
    marginTop: 2,
    color: "#000000",
    letterSpacing: 0.15,
  },
  termsUpdated: {
    width: "100%",
    textAlign: "center",
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    marginBottom: 18,
  },
  termsSection: {
    marginBottom: 10,
  },
  termsSectionTitle: {
    fontSize: 11,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    color: SECTION_TITLE_BLUE,
    marginBottom: 5,
  },
  termsSubARow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 12,
  },
  termsSubALabel: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 700,
    width: 18,
    color: "#000000",
  },
  termsSubAText: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    flex: 1,
    lineHeight: 1.55,
  },
  termsNumRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 28,
  },
  termsNumLabel: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    width: 16,
    color: "#000000",
  },
  termsNumText: {
    fontSize: 10,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
    flex: 1,
    lineHeight: 1.5,
  },

  // ── Page footer (fixed: repeats on wrapped pages within each <Page>) ───────
  pageFooter: {
    position: "absolute",
    bottom: 18,
    left: MARGIN,
    right: MARGIN,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#CFCFCF",
    paddingTop: 6,
  },
  pageFooterColLeft: {
    width: "32%",
  },
  pageFooterColCenter: {
    width: "36%",
    textAlign: "center",
  },
  pageFooterColRight: {
    width: "32%",
    textAlign: "right",
  },
  pageFooterText: {
    fontSize: 9,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#555555",
  },
  pageFooterPageNum: {
    fontSize: 9,
    fontFamily: QUOTE_BODY,
    fontWeight: 400,
    color: "#000000",
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
    <View style={s.sectionHeading} minPresenceAhead={64}>
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
      <View style={s.pageFooterColLeft}>
        <Text style={s.pageFooterText}>{refNum}</Text>
      </View>
      <View style={s.pageFooterColCenter}>
        <Text
          style={s.pageFooterPageNum}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>
      <View style={s.pageFooterColRight}>
        <Text style={s.pageFooterText}>{version}</Text>
      </View>
    </View>
  );
}

function FinancialDataRow({ item }: { item: LineItem }) {
  return (
    <View style={s.tableDataRow} wrap={false}>
      <View style={[s.tableBodyCol, s.colName, s.tableBodyColName]}>
        <Text style={s.cellName}>{item.name}</Text>
      </View>
      <View style={[s.tableBodyCol, s.colDesc, s.tableBodyColDesc]}>
        <Text style={s.cellDesc}>{item.description}</Text>
      </View>
      <View
        style={[s.tableBodyCol, s.colUnits, s.tableBodyColNumeric]}
      >
        <Text style={s.cellNum}>
          {item.quantity} {item.unit}
        </Text>
      </View>
      <View
        style={[s.tableBodyCol, s.colPrice, s.tableBodyColNumeric]}
      >
        <Text style={s.cellNum}>{fmt(item.rate)}</Text>
      </View>
      <View
        style={[s.tableBodyCol, s.colSubtotal, s.tableBodyColNumeric]}
      >
        <Text style={s.cellNumBold}>{fmt(item.total)}</Text>
      </View>
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

  const {
    laborItems,
    equipItems,
    postItems,
    discountItems,
    miscOtherItems,
    recordingEquipItems,
    nonRecordingEquipItems,
  } = groupLineItems(items);

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
      <Page size="A4" style={s.pageCover}>
        <Text style={s.coverVersionTopLeft}>{versionLabel}</Text>

        {/* Centered header — date, program title, services subtitle */}
        <View style={s.coverHeroWrap}>
          <Text style={s.coverHeroDate}>
            {data.hasDate && data.eventDate
              ? formatDate(data.eventDate)
              : fullDate}
          </Text>
          <Text style={s.coverHeroTitle}>{eventName}</Text>
          <Text style={s.coverHeroSubtitle}>{servicesLine}</Text>
        </View>

        {/* For — left */}
        <View style={s.coverLeftBlock}>
          <Text style={s.coverSectionLabel}>For</Text>
          {!data.isSpecQuote ? (
            <>
              {org ? <Text style={s.coverEntityLine}>{org}</Text> : null}
              {!org && clientName && clientName !== "TBD" ? (
                <Text style={s.coverEntityLine}>{clientName}</Text>
              ) : null}
              {org && clientName && clientName !== "TBD" ? (
                <Text style={s.coverContactLine}>Contact: {clientName}</Text>
              ) : null}
              {!org && (!clientName || clientName === "TBD") ? (
                <Text style={s.coverContactLine}>Contact: TBD</Text>
              ) : null}
              {clientPhone ? (
                <Text style={s.coverPhoneSmall}>{clientPhone}</Text>
              ) : null}
              {data.deliveryEmail ? (
                <Text style={s.coverEmailSmall}>{data.deliveryEmail}</Text>
              ) : null}
            </>
          ) : (
            <Text style={s.coverSpecNote}>(Spec Quote)</Text>
          )}
        </View>

        {/* At — left */}
        <View style={s.coverLeftBlock}>
          <Text style={s.coverSectionLabel}>At</Text>
          <Text style={s.coverVenueTitle}>{venueName}</Text>
          <Text style={s.coverVenueDetail}>{setting}</Text>
          <Text style={s.coverVenueDetail}>Event date: {eventDate}</Text>
          <Text style={s.coverVenueDetail}>Duration: {duration}</Text>
        </View>

        <View style={s.coverSpacer} />

        {/* To Be Produced By — lower page (reference placement) */}
        <View style={s.coverProducerBlock}>
          <Text style={s.coverSectionLabel}>To Be Produced By</Text>
          <Text style={s.coverProducerCompany}>The Recording Service LLC</Text>
          <Text style={s.coverProducerName}>Harry Barnes</Text>
          <Text style={s.coverPhoneSmall}>770-696-3139</Text>
          <Text style={s.coverEmailSmall}>harry@therecordingservice.com</Text>
        </View>

        <View style={s.coverFooterRef}>
          <Text style={s.coverRefNumber}>{refNum}</Text>
        </View>
      </Page>

      {/* ════════════════════════════════════════════════════════════════
          PAGE 2+ — SCOPE / WORK PLAN / LOCATION
      ════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.pageInner}>
        {/* ── Client Will Provide (pink box) ─────────────────────────── */}
        <View style={s.clientProvideBox}>
          <View style={s.clientProvideTitleBar}>
            <Text style={s.clientProvideTitle}>
              *** Client Will Provide The Following ***
            </Text>
          </View>
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
              <Text style={s.clientProvideBold}>Run of Show document</Text>
              {" "}
              detailing the program
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
            <SectionHeading title="Work Plan (day-by-day)" />
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
            {workPlan.cocktailTimeUnknown && (
              <Text style={s.workPlanNote}>
                * Reception end time not shown — provide a program end time or
                duration for a complete work plan.
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
      <Page size="A4" style={s.pageInner}>
        <Text style={s.financialsTitle}>Detailed Financials</Text>

        <View style={s.tableWrapper}>
          {/* Table header row — all columns centered (reference) */}
          <View style={s.tableHeaderRow}>
            <View style={[s.tableHeadCol, s.colName]}>
              <Text style={s.tableHeaderCell}>Item Name</Text>
            </View>
            <View style={[s.tableHeadCol, s.colDesc]}>
              <Text style={s.tableHeaderCell}>Item Description</Text>
            </View>
            <View
              style={[s.tableHeadCol, s.colUnits, s.tableHeadColNumeric]}
            >
              <Text style={s.tableHeaderCell}>Units</Text>
            </View>
            <View
              style={[s.tableHeadCol, s.colPrice, s.tableHeadColNumeric]}
            >
              <Text style={s.tableHeaderCell}>Price / Unit</Text>
            </View>
            <View
              style={[
                s.tableHeadCol,
                s.colSubtotal,
                s.tableHeadColNumeric,
                s.tableHeadColEnd,
              ]}
            >
              <Text style={s.tableHeaderCell}>Subtotal</Text>
            </View>
          </View>

          {/* Labor */}
          {laborItems.length > 0 && (
            <>
              <View style={s.tableSectionRow}>
                <Text style={s.tableSectionLabel}>Labor</Text>
              </View>
              {laborItems.map((item, idx) => (
                <FinancialDataRow
                  key={`labor-${item.name}-${idx}`}
                  item={item}
                />
              ))}
            </>
          )}

          {/* Equipment (+ optional RECORDING / AUDIO · PA sub-bands) */}
          {equipItems.length > 0 && (
            <>
              <View style={s.tableSectionRow}>
                <Text style={s.tableSectionLabel}>Equipment</Text>
              </View>
              {recordingEquipItems.length > 0 && (
                <>
                  <View style={s.tableSubSectionRow}>
                    <Text style={s.tableSubSectionLabel}>RECORDING</Text>
                  </View>
                  {recordingEquipItems.map((item, idx) => (
                    <FinancialDataRow
                      key={`eq-rec-${item.name}-${idx}`}
                      item={item}
                    />
                  ))}
                </>
              )}
              {nonRecordingEquipItems.length > 0 && (
                <>
                  {recordingEquipItems.length > 0 && (
                    <View style={s.tableSubSectionRow}>
                      <Text style={s.tableSubSectionLabel}>
                        AUDIO / PA
                      </Text>
                    </View>
                  )}
                  {nonRecordingEquipItems.map((item, idx) => (
                    <FinancialDataRow
                      key={`eq-pa-${item.name}-${idx}`}
                      item={item}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {/* Post-Production */}
          {postItems.length > 0 && (
            <>
              <View style={s.tableSectionRow}>
                <Text style={s.tableSectionLabel}>Post-Production</Text>
              </View>
              {postItems.map((item, idx) => (
                <FinancialDataRow
                  key={`post-${item.name}-${idx}`}
                  item={item}
                />
              ))}
            </>
          )}

          {/* Discounts */}
          {discountItems.length > 0 && (
            <>
              <View style={s.tableSectionRow}>
                <Text style={s.tableSectionLabel}>Discounts</Text>
              </View>
              {discountItems.map((item, idx) => (
                <FinancialDataRow
                  key={`disc-${item.name}-${idx}`}
                  item={item}
                />
              ))}
            </>
          )}

          {/* Other (e.g. rush fee) */}
          {miscOtherItems.length > 0 && (
            <>
              <View style={s.tableSectionRow}>
                <Text style={s.tableSectionLabel}>Other</Text>
              </View>
              {miscOtherItems.map((item, idx) => (
                <FinancialDataRow
                  key={`other-${item.name}-${idx}`}
                  item={item}
                />
              ))}
            </>
          )}
        </View>

        {/* Total — left-aligned below bordered grid (reference) */}
        <View style={s.totalRow}>
          <Text style={s.totalText}>Total: {fmt(subtotal)}</Text>
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
      <Page size="A4" style={s.pageInner}>
        <View style={s.termsPageHeader}>
          <Text style={s.termsPageTitle}>Terms and Conditions</Text>
          <Text style={s.termsUpdated}>Last updated: April 1, 2024</Text>
        </View>

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
