import {
  AlignmentType,
  BorderStyle,
  Document,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
} from "docx";
import type { QuoteFormData } from "@/schema/quote";
import type { LineItem } from "@/lib/calculateSOW";
import { computeWorkPlan } from "@/lib/calculateWorkPlan";
import { groupLineItems } from "@/lib/quoteLineItemGroups";
import { fmt } from "@/lib/utils";
import { QUOTE_DOC_THEME as T } from "@/lib/quoteDocTheme";

const FONT = "Arial";
const pt = (value: number) => Math.round(value * 2);

function asciiSafe(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[‐‑‒–—―−]/g, "-")
    .replace(/[•●○◦▪■]/g, "-")
    .replace(/×/g, "x")
    .replace(/·/g, "|")
    .replace(/→/g, "->")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E\n\r\t]/g, "");
}

/** ~10pt cell padding (twips: 1 pt ≈ 20 twips) */
const CELL_PAD = 200;
const BORDER_1PT = { style: BorderStyle.SINGLE, size: 8, color: T.TABLE_BORDER } as const;
const cellBorders = {
  top: BORDER_1PT,
  bottom: BORDER_1PT,
  left: BORDER_1PT,
  right: BORDER_1PT,
};

function tr(
  text: string,
  opts?: {
    bold?: boolean;
    italics?: boolean;
    sizePt?: number;
    color?: string;
    underline?: boolean;
    allCaps?: boolean;
  },
): TextRun {
  return new TextRun({
    text: asciiSafe(text),
    font: FONT,
    bold: opts?.bold,
    italics: opts?.italics,
    allCaps: opts?.allCaps,
    size: pt(opts?.sizePt ?? 11),
    color: opts?.color,
    underline: opts?.underline ? { type: UnderlineType.SINGLE } : undefined,
  });
}

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

function sectionTitleParagraph(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 220, after: 100 },
    children: [
      tr(title.toUpperCase(), {
        bold: true,
        sizePt: 12,
        color: T.SECTION_TITLE_BLUE,
      }),
    ],
  });
}

function serviceSubParagraph(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 60 },
    indent: { left: 160 },
    children: [
      tr(title.toUpperCase(), {
        bold: true,
        sizePt: 10.5,
        color: T.SECTION_TITLE_BLUE,
      }),
    ],
  });
}

function bulletParagraph(text: string, boldLead?: string): Paragraph {
  const children: TextRun[] = [tr("- ", { sizePt: 11 })];
  if (boldLead) {
    children.push(tr(boldLead, { bold: true, sizePt: 11 }));
    children.push(tr(text.slice(boldLead.length), { sizePt: 11 }));
  } else {
    children.push(tr(text, { sizePt: 11 }));
  }
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 160 },
    children,
  });
}

function subBulletParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 50 },
    indent: { left: 320 },
    children: [tr("- ", { sizePt: 10, color: "555555" }), tr(text, { sizePt: 11 })],
  });
}

function finCell(
  runs: TextRun[],
  opts: {
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    shading?: string;
    widthPct?: number;
    valign?: "top" | "center";
  },
): TableCell {
  return new TableCell({
    width: opts.widthPct
      ? { size: opts.widthPct, type: WidthType.PERCENTAGE }
      : undefined,
    shading: opts.shading ? { fill: opts.shading } : undefined,
    verticalAlign: opts.valign === "top" ? "top" : "center",
    margins: { top: CELL_PAD, bottom: CELL_PAD, left: CELL_PAD, right: CELL_PAD },
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: opts.align,
        children: runs,
      }),
    ],
  });
}

function finRowFromItem(item: LineItem): TableRow {
  return new TableRow({
    children: [
      finCell([tr(item.name, { bold: true, sizePt: 10 })], {
        align: AlignmentType.CENTER,
        widthPct: 22,
      }),
      finCell([tr(item.description, { sizePt: 10 })], {
        align: AlignmentType.LEFT,
        widthPct: 42,
        valign: "top",
      }),
      finCell([tr(`${item.quantity} ${item.unit}`, { sizePt: 10 })], {
        align: AlignmentType.CENTER,
        widthPct: 10,
      }),
      finCell([tr(fmt(item.rate), { sizePt: 10 })], {
        align: AlignmentType.CENTER,
        widthPct: 13,
      }),
      finCell([tr(fmt(item.total), { bold: true, sizePt: 10 })], {
        align: AlignmentType.CENTER,
        widthPct: 13,
      }),
    ],
  });
}

function sectionBannerRow(label: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 5,
        shading: { fill: T.TABLE_SECTION_BG },
        margins: { top: 160, bottom: 160, left: 200, right: 200 },
        borders: cellBorders,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              tr(label.toUpperCase(), {
                bold: true,
                sizePt: 10,
                color: T.BLACK,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function subSectionBannerRow(label: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 5,
        shading: { fill: "FFFFFF" },
        margins: { top: 140, bottom: 140, left: 200, right: 200 },
        borders: cellBorders,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              tr(label.toUpperCase(), {
                bold: true,
                sizePt: 10,
                color: T.BLACK,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildFinancialTable(
  g: ReturnType<typeof groupLineItems>,
): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      finCell([tr("Item Name", { bold: true, sizePt: 10.5 })], {
        align: AlignmentType.CENTER,
        shading: "FFFFFF",
        widthPct: 22,
      }),
      finCell([tr("Item Description", { bold: true, sizePt: 10.5 })], {
        align: AlignmentType.CENTER,
        shading: "FFFFFF",
        widthPct: 42,
      }),
      finCell([tr("Units", { bold: true, sizePt: 10.5 })], {
        align: AlignmentType.CENTER,
        shading: "FFFFFF",
        widthPct: 10,
      }),
      finCell([tr("Price / Unit", { bold: true, sizePt: 10.5 })], {
        align: AlignmentType.CENTER,
        shading: "FFFFFF",
        widthPct: 13,
      }),
      finCell([tr("Subtotal", { bold: true, sizePt: 10.5 })], {
        align: AlignmentType.CENTER,
        shading: "FFFFFF",
        widthPct: 13,
      }),
    ],
  });

  const rows: TableRow[] = [headerRow];

  const pushItems = (items: LineItem[]) => {
    items.forEach((item) => rows.push(finRowFromItem(item)));
  };

  if (g.laborItems.length) {
    rows.push(sectionBannerRow("Labor"));
    pushItems(g.laborItems);
  }
  if (g.equipItems.length) {
    rows.push(sectionBannerRow("Equipment"));
    if (g.recordingEquipItems.length) {
      rows.push(subSectionBannerRow("RECORDING"));
      pushItems(g.recordingEquipItems);
    }
    if (g.nonRecordingEquipItems.length) {
      if (g.recordingEquipItems.length) {
        rows.push(subSectionBannerRow("AUDIO / PA"));
      }
      pushItems(g.nonRecordingEquipItems);
    }
  }
  if (g.postItems.length) {
    rows.push(sectionBannerRow("Post-Production"));
    pushItems(g.postItems);
  }
  if (g.discountItems.length) {
    rows.push(sectionBannerRow("Discounts"));
    pushItems(g.discountItems);
  }
  if (g.miscOtherItems.length) {
    rows.push(sectionBannerRow("Other"));
    pushItems(g.miscOtherItems);
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

function technicalScopeParagraphs(data: QuoteFormData): Paragraph[] {
  const out: Paragraph[] = [sectionTitleParagraph("Technical Scope")];
  const hasStreaming = data.services?.includes("streaming") ?? false;
  const hasVideo = data.services?.includes("video") ?? false;
  const hasPA = data.audioServices?.includes("pa") ?? false;
  const studioVideoTypes = hasVideo ? (data.videoTypes ?? []) : [];
  const videoBuiltInActive = hasVideo && (data.videoBuiltInEnabled ?? false);
  const videoTRSActive = hasVideo && (data.videoTRSEnabled ?? false);
  const builtInEditing = videoBuiltInActive ? (data.videoBuiltInEditing ?? []) : [];
  const trsEditing = videoTRSActive ? (data.videoTRSEditing ?? []) : [];
  const hasLecture = builtInEditing.includes("lecture") || trsEditing.includes("lecture");
  const hasHighlight = trsEditing.includes("highlight");

  if (hasStreaming) {
    out.push(serviceSubParagraph("Live Streaming"));
    out.push(
      bulletParagraph(
        "STREAM KIT: Encoder, switcher, and stream control system",
        "STREAM KIT:",
      ),
    );
    out.push(
      bulletParagraph(
        `CAMERA SETUP: ${data.cameraCount ?? "1"} camera(s) - ${data.cameraSource === "built-in" ? "using venue built-in cameras" : "camcorder kit(s)"}`,
        "CAMERA SETUP:",
      ),
    );
    if (data.streamGraphics) {
      out.push(
        bulletParagraph(
          "STREAM GRAPHICS: On-screen overlays and branding prepared",
          "STREAM GRAPHICS:",
        ),
      );
    }
    if (!data.diyStream) {
      out.push(
        bulletParagraph(
          "STREAM LINK SETUP: Destination platform configured by our tech",
          "STREAM LINK SETUP:",
        ),
      );
    }
  }

  if (hasVideo) {
    out.push(serviceSubParagraph("Video Production"));
    if (studioVideoTypes.includes("podcast")) {
      out.push(bulletParagraph("VIDEO PODCAST", "VIDEO PODCAST"));
      out.push(subBulletParagraph("2x Mirrorless camera kit + Studio lighting kit"));
      out.push(subBulletParagraph("Production Lead + Lighting Technician"));
      out.push(subBulletParagraph(`${data.podcastEpisodes ?? 1} episode(s) - ${data.podcastDuration ?? 1} hr recording session each`));
      out.push(subBulletParagraph("Guests should arrive at least 15 minutes before filming to be mic'd up"));
    }
    if (studioVideoTypes.includes("web-video")) {
      out.push(bulletParagraph("WEB VIDEO", "WEB VIDEO"));
      out.push(subBulletParagraph("Mirrorless camera kit + Studio lighting kit"));
      out.push(subBulletParagraph(`${data.webVideoPeople ?? 1} person(s) filmed - ${data.webVideoCount ?? 1} video(s) produced - up to ${data.webVideoDuration ?? 3} min each`));
      out.push(subBulletParagraph("Guests should arrive at least 15 minutes before filming to be mic'd up"));
    }
    if (hasHighlight) {
      out.push(bulletParagraph("EVENT HIGHLIGHT", "EVENT HIGHLIGHT"));
      out.push(subBulletParagraph("Mirrorless camera kit - in 30 min, out 30 min"));
      out.push(subBulletParagraph("Full Day Rate applies (duration based on event length)"));
      out.push(subBulletParagraph("Delivered as a creative highlight reel"));
    }
    if (hasLecture) {
      out.push(bulletParagraph("LECTURE OR PANEL DISCUSSION", "LECTURE OR PANEL DISCUSSION"));
      if (videoTRSActive && trsEditing.includes("lecture")) {
        out.push(subBulletParagraph(`${data.videoTRSCameraAngles ?? 1} camera angle(s) - camcorder kit(s) provided by TRS`));
      }
      if (videoBuiltInActive && builtInEditing.includes("lecture")) {
        out.push(subBulletParagraph("Using venue built-in cameras"));
      }
      out.push(subBulletParagraph(`${data.lectureTalksCount ?? 1} talk(s) - ${data.lectureTalkDuration ?? "up to 1hr"} each`));
      if (data.lecturePPT) {
        out.push(subBulletParagraph("Includes PowerPoint slide recording and integration"));
      }
      out.push(subBulletParagraph("STANDARD VIDEO EDIT: Audio touch-ups, subtitles (.srt), lower thirds, intro/outro screens"));
    }
  }

  if (hasPA) {
    out.push(serviceSubParagraph("Audio / Public Address"));
    out.push(
      bulletParagraph(
        `${data.setting === "outdoor" ? "OUTDOOR" : "INDOOR"} AUDIO KIT: Full PA system`,
        `${data.setting === "outdoor" ? "OUTDOOR" : "INDOOR"} AUDIO KIT:`,
      ),
    );
    if (!data.builtInAV?.includes("audio")) {
      if ((data.micWirelessComboKits ?? 0) > 0) {
        out.push(
          subBulletParagraph(
            `Wireless Combo Kit x${data.micWirelessComboKits}`,
          ),
        );
      }
      if ((data.micWiredMicKits ?? 0) > 0) {
        out.push(subBulletParagraph(`Wired Mic Kit (SM58) x${data.micWiredMicKits}`));
      }
      if ((data.micGooseneckMics ?? 0) > 0) {
        out.push(
          subBulletParagraph(`Gooseneck Mic x${data.micGooseneckMics}`),
        );
      }
      if (data.micNotSure) {
        out.push(
          subBulletParagraph("Mic quantity TBD - Producer will follow up"),
        );
      }
    } else {
      out.push(subBulletParagraph("Using venue built-in sound system"));
    }
    if (data.vogEnabled) {
      out.push(
        subBulletParagraph(
          `Voice of God mic - ${data.vogAnnouncer === "tech" ? "announced by our audio tech" : "announced by client team"}`,
        ),
      );
    }
    if (data.monitorsEnabled && (data.monitors ?? 0) > 0) {
      out.push(subBulletParagraph(`Stage monitor wedges x${data.monitors}`));
    }
    if ((data.attendance ?? 0) > 0) {
      out.push(
        subBulletParagraph(
          `Expected attendance: ${data.attendance} - speaker count calculated accordingly`,
        ),
      );
    }
  }

  return out;
}

function estimateNoteTable(): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: T.NOTE_BORDER },
              bottom: {
                style: BorderStyle.SINGLE,
                size: 4,
                color: T.NOTE_BORDER,
              },
              left: { style: BorderStyle.SINGLE, size: 4, color: T.NOTE_BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: T.NOTE_BORDER },
            },
            shading: { fill: T.NOTE_BG },
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  tr("This is an Estimate", {
                    bold: true,
                    sizePt: 10,
                    color: T.SECTION_TITLE_BLUE,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  tr(
                    "This is the price of the tech scope we have discussed so far. If the scope or deliverables change, the final price will be different. Your Production Lead will discuss with you about anything that would affect the final price (e.g., extra microphones, the show running late, etc).",
                    { sizePt: 10, color: T.NOTE_BODY },
                  ),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function termsParagraphs(): Paragraph[] {
  const p = (
    text: string,
    opts?: { bold?: boolean; sizePt?: number; indent?: number; blue?: boolean },
  ) =>
    new Paragraph({
      spacing: { after: opts?.bold ? 80 : 60 },
      indent: opts?.indent ? { left: opts.indent } : undefined,
      children: [
        tr(text, {
          bold: opts?.bold,
          sizePt: opts?.sizePt ?? 10,
          color: opts?.blue ? T.SECTION_TITLE_BLUE : T.BLACK,
        }),
      ],
    });

  const out: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        tr("Terms and Conditions", { bold: true, sizePt: 18, color: T.BLACK }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [tr("Last updated: April 1, 2024", { sizePt: 10, color: T.BLACK })],
    }),
    p("I. Rush Fee", { bold: true, sizePt: 11, indent: 0, blue: true }),
    p(
      "A. A rush fee not to exceed 20% of the quote shall apply to any events requested with less than two (2) full business days' notice (16 business hours).",
      { indent: 240 },
    ),
    p("II. Cancellation Fee", { bold: true, sizePt: 11, blue: true }),
    p("A. 30-6 Days Before Event:", { indent: 240 }),
    p("1. Pre-Production: Fully billed for work completed to date", { indent: 480 }),
    p("2. Production Labor: 50% charge", { indent: 480 }),
    p("3. Equipment: 25% of quoted cost", { indent: 480 }),
    p("4. Post-Production: No charge", { indent: 480 }),
    p("B. 5-1 Day Before Event:", { indent: 240 }),
    p("1. Production Labor: 50% charge for all labor", { indent: 480 }),
    p("2. Equipment: 50% of quoted cost", { indent: 480 }),
    p("C. Less than 24 Hours:", { indent: 240 }),
    p("1. Production Labor: Fully billed", { indent: 480 }),
    p("2. Equipment: Fully billed", { indent: 480 }),
    p("3. Post-Production: No charge", { indent: 480 }),
    p("III. Edited Video Reviews and Revisions", { bold: true, sizePt: 11, blue: true }),
    p(
      "A. Clients have 60 days from the date of delivery to review and submit feedback.",
      { indent: 240 },
    ),
    p(
      "B. Once feedback is received, a revised version will be completed and delivered within 2 business days.",
      { indent: 240 },
    ),
    p("IV. PowerPoint Presentation", { bold: true, sizePt: 11, blue: true }),
    p("A. PPTs must be submitted at least 3 days prior to the event.", { indent: 240 }),
    p(
      "B. Discounts or refunds will not be issued for issues related to PPTs not delivered within this timeframe.",
      { indent: 240 },
    ),
    p("V. This is an Estimate", { bold: true, sizePt: 11, blue: true }),
    p(
      "A. This document represents the price of the technical scope discussed to date.",
      { indent: 240 },
    ),
    p(
      "B. If the scope or deliverables change, the final price will differ.",
      { indent: 240 },
    ),
    p(
      "C. Your Production Lead will discuss anything that would affect the final price (e.g., extra microphones, the show running late).",
      { indent: 240 },
    ),
    p("VI. Deposit Requirement for Projects Exceeding $10,000", {
      bold: true,
      sizePt: 11,
      blue: true,
    }),
    p("A. For projects valued over $10,000, a 50% deposit is required.", {
      indent: 240,
    }),
    p(
      "B. This deposit must be paid 14 days before the first day of your show.",
      { indent: 240 },
    ),
    p("VII. Video Editing Billing", { bold: true, sizePt: 11, blue: true }),
    p(
      'A. For projects with video editing, billing is split into "Production Day" and "Video Editing" expenses.',
      { indent: 240 },
    ),
    p(
      "B. Filming production costs are included in the second invoice, except if TRS Tech delivers raw footage immediately after filming.",
      { indent: 240 },
    ),
    p("VIII. Holidays", { bold: true, sizePt: 11, blue: true }),
    p("A. The following holidays are billed at 1.5x labor rate:", { indent: 240 }),
  ];
  const h15 = [
    "New Year's Day",
    "Memorial Day",
    "Independence Day (July 4th)",
    "Labor Day",
    "Black Friday",
    "New Year's Eve (after 12 PM)",
  ];
  h15.forEach((h, i) => {
    out.push(p(`${i + 1}. ${h}`, { indent: 480 }));
  });
  out.push(
    p("B. The following holidays are billed at 2x labor rate:", { indent: 240 }),
  );
  ["Thanksgiving", "Christmas Eve", "Christmas Day"].forEach((h, i) => {
    out.push(p(`${i + 1}. ${h}`, { indent: 480 }));
  });
  return out;
}

export function buildQuoteDocxDocument(
  data: QuoteFormData,
  items: LineItem[],
  subtotal: number,
): Document {
  const now = new Date();
  const versionDate = now
    .toLocaleDateString("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, ".");
  const versionLabel = `${versionDate} Version`;
  const refNum = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
  const fullDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const eventName = data.eventName ?? "Untitled Event";
  const venueName = data.venueName ?? "TBD";
  const clientName = data.clientName ?? "TBD";
  const org = data.organization ?? "";
  const clientPhone = data.clientPhone ?? "";
  const eventDate =
    data.hasDate && data.eventDate ? formatDate(data.eventDate) : "TBD";
  const duration = data.hasDuration ? `${data.durationHours} hours` : "TBD";
  const setting = data.setting === "outdoor" ? "Outdoor" : "Indoor";
  const hasStreaming = data.services?.includes("streaming") ?? false;
  const hasSiteVisit = data.builtInAV?.includes("not-sure") ?? false;
  const builtInAVList = (data.builtInAV ?? []).filter((x) => x !== "not-sure");

  const servicesLine =
    [
      hasStreaming ? "Live Streaming" : null,
      data.services?.includes("video") ? "Video Production" : null,
      data.audioServices?.includes("pa") ? "Audio / PA" : null,
    ]
      .filter(Boolean)
      .join(" | ") || "Production Estimate";

  const heroDate =
    data.hasDate && data.eventDate ? formatDate(data.eventDate) : fullDate;

  const workPlan = computeWorkPlan(data);
  const g = groupLineItems(items);

  const coverChildren: (Paragraph | Table)[] = [
    new Paragraph({
      children: [tr(versionLabel, { sizePt: 10, color: T.COVER_VERSION_REF })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [tr(heroDate, { bold: true, sizePt: 17, color: T.BLACK })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [tr(eventName, { bold: true, sizePt: 30, color: T.BLACK })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [tr(servicesLine, { sizePt: 23, color: T.BLACK })],
    }),
  ];

  if (!data.isSpecQuote) {
    if (org) {
      coverChildren.push(
        new Paragraph({
          children: [tr(org, { bold: true, sizePt: 21, color: T.BLACK })],
        }),
      );
    }
    if (org && clientName && clientName !== "TBD") {
      coverChildren.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [
            tr(`Contact: ${clientName}`, { sizePt: 15, color: T.COVER_ACCENT }),
          ],
        }),
      );
    }
    if (!org && clientName && clientName !== "TBD") {
      coverChildren.push(
        new Paragraph({
          children: [tr(clientName, { bold: true, sizePt: 21, color: T.BLACK })],
        }),
      );
    }
    if (!org && (!clientName || clientName === "TBD")) {
      coverChildren.push(
        new Paragraph({
          children: [tr("Contact: TBD", { sizePt: 15, color: T.COVER_ACCENT })],
        }),
      );
    }
    if (clientPhone) {
      coverChildren.push(
        new Paragraph({
          spacing: { before: 60 },
          children: [tr(clientPhone, { sizePt: 10, color: T.COVER_LABEL })],
        }),
      );
    }
    if (data.deliveryEmail) {
      coverChildren.push(
        new Paragraph({
          spacing: { before: 40 },
          children: [
            tr(data.deliveryEmail, {
              sizePt: 10,
              color: T.COVER_ACCENT,
              underline: true,
            }),
          ],
        }),
      );
    }
  } else {
    coverChildren.push(
      new Paragraph({
        children: [tr("(Spec Quote)", { italics: true, sizePt: 10, color: T.COVER_LABEL })],
      }),
    );
  }

  coverChildren.push(
    new Paragraph({
      spacing: { before: 480 },
      children: [tr("At", { sizePt: 10.5, color: T.COVER_LABEL })],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [tr(venueName, { sizePt: 15, color: T.COVER_ACCENT })],
    }),
    new Paragraph({
      children: [tr(setting, { sizePt: 10, color: T.COVER_LABEL })],
    }),
    new Paragraph({
      children: [tr(`Event date: ${eventDate}`, { sizePt: 10, color: T.COVER_LABEL })],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [tr(`Duration: ${duration}`, { sizePt: 10, color: T.COVER_LABEL })],
    }),
    new Paragraph({
      spacing: { before: 600 },
      children: [tr("To Be Produced By", { sizePt: 10.5, color: T.COVER_LABEL })],
    }),
    new Paragraph({
      children: [
        tr("The Recording Service LLC", { bold: true, sizePt: 21, color: T.BLACK }),
      ],
    }),
    new Paragraph({
      spacing: { before: 80 },
      children: [tr("Harry Barnes", { sizePt: 15, color: T.COVER_ACCENT })],
    }),
    new Paragraph({
      spacing: { before: 60 },
      children: [tr("770-696-3139", { sizePt: 10, color: T.COVER_LABEL })],
    }),
    new Paragraph({
      spacing: { before: 40 },
      children: [
        tr("harry@therecordingservice.com", {
          sizePt: 10,
          color: T.COVER_ACCENT,
          underline: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 800 },
      children: [tr(refNum, { sizePt: 10, color: T.COVER_VERSION_REF })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  const clientProvideChildren: Paragraph[] = [
    new Paragraph({
      shading: { fill: T.CLIENT_PROVIDE_HEADER_BG },
      spacing: { before: 80, after: 160 },
      indent: { left: 160, right: 160 },
      children: [
        tr("*** Client Will Provide The Following ***", {
          bold: true,
          sizePt: 17,
          color: T.CLIENT_PROVIDE_TITLE_TEXT,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        tr("1.", { sizePt: 11.5 }),
        tr(" Please provide three (3) days before the production:", { sizePt: 11.5 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      indent: { left: 400 },
      children: [
        tr("a.", { sizePt: 11.5 }),
        tr(" ", { sizePt: 11.5 }),
        tr("Run of Show document", { bold: true, sizePt: 11.5 }),
        tr(" detailing the program", { sizePt: 11.5 }),
      ],
    }),
  ];

  const subLabels = "bcdefghijklmnopqrstuvwxyz".split("");
  let subIdx = 0;
  const pushProvideSub = (body: string) => {
    const lab = subLabels[subIdx] ?? "?";
    subIdx += 1;
    clientProvideChildren.push(
      new Paragraph({
        spacing: { after: 80 },
        indent: { left: 400 },
        children: [
          tr(`${lab}.`, { sizePt: 11.5 }),
          tr(` ${body}`, { sizePt: 11.5 }),
        ],
      }),
    );
  };
  if (builtInAVList.length) {
    pushProvideSub(`Access to venue's built-in AV: ${builtInAVList.join(", ")}`);
  }
  if (hasStreaming) {
    pushProvideSub(
      "Internet upload speed of at least 15 mb/s per streaming platform",
    );
  }
  if (hasSiteVisit) {
    pushProvideSub(
      "Venue access for site visit - Producer will evaluate built-in AV and apply discounts accordingly",
    );
  }

  const scopePage: (Paragraph | Table)[] = [
    ...clientProvideChildren,
    ...technicalScopeParagraphs(data),
  ];

  if (workPlan.rows.length > 0) {
    scopePage.push(sectionTitleParagraph("Work Plan (day-by-day)"));
    if (workPlan.dateHeader) {
      scopePage.push(
        new Paragraph({
          spacing: { after: 80 },
          indent: { left: 160 },
          children: [
            tr(workPlan.dateHeader, {
              bold: true,
              sizePt: 11,
              color: T.SECTION_TITLE_BLUE,
            }),
          ],
        }),
      );
    }
    workPlan.rows.forEach((row) => {
      scopePage.push(
        new Paragraph({
          spacing: { after: 70 },
          indent: { left: 160 },
          children: [
            tr("- ", { sizePt: 11, color: "555555" }),
            tr(`${row.time} `, { bold: true, sizePt: 11 }),
            tr(row.description, { sizePt: 11 }),
          ],
        }),
      );
    });
    if (workPlan.usedDefaultTime) {
      scopePage.push(
        new Paragraph({
          spacing: { before: 80 },
          indent: { left: 160 },
          children: [
            tr(
              "* Times are approximate - based on an assumed 12:00 PM show start. Your Production Lead will confirm the final schedule.",
              { italics: true, sizePt: 10, color: "555555" },
            ),
          ],
        }),
      );
    }
    if (workPlan.cocktailTimeUnknown) {
      scopePage.push(
        new Paragraph({
          spacing: { before: 60 },
          indent: { left: 160 },
          children: [
            tr(
              "* Reception end time not shown - provide a program end time or duration for a complete work plan.",
              { italics: true, sizePt: 10, color: "555555" },
            ),
          ],
        }),
      );
    }
  }

  scopePage.push(sectionTitleParagraph("Rain Plan"));
  scopePage.push(
    bulletParagraph(
      data.setting === "outdoor"
        ? "TBD - your Production Lead will discuss a rain contingency plan before your event."
        : "N/A",
    ),
  );

  scopePage.push(sectionTitleParagraph("Location"));
  const loc = (label: string, value: string) =>
    new Paragraph({
      spacing: { after: 70 },
      indent: { left: 160 },
      children: [
        tr(`${label}: `, { bold: true, sizePt: 11 }),
        tr(value, { sizePt: 11 }),
      ],
    });
  scopePage.push(loc("Venue", venueName));
  scopePage.push(loc("Setting", setting));
  scopePage.push(loc("Event Date", eventDate));
  scopePage.push(loc("Duration", duration));
  if (builtInAVList.length) {
    scopePage.push(loc("Built-in AV Available", builtInAVList.join(", ")));
  }
  if (hasSiteVisit) {
    scopePage.push(
      loc(
        "AV Assessment",
        "Site visit requested - Producer will evaluate and apply discounts accordingly",
      ),
    );
  }

  scopePage.push(new Paragraph({ children: [new PageBreak()] }));

  const financialPage: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        tr("Detailed Financials", {
          bold: true,
          sizePt: 25,
          color: T.BLACK,
        }),
      ],
    }),
    buildFinancialTable(g),
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [
        tr(`Total: ${fmt(subtotal)}`, { bold: true, sizePt: 19, color: T.BLACK }),
      ],
    }),
    new Paragraph({ spacing: { before: 200 } }),
    estimateNoteTable(),
    new Paragraph({ children: [new PageBreak()] }),
    ...termsParagraphs(),
  ];

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [...coverChildren, ...scopePage, ...financialPage],
      },
    ],
  });
}
