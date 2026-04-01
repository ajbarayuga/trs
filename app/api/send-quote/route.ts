import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { Resend } from "resend";
import { QuoteFormSchema } from "@/schema/quote";
import { calculateSOW, type LineItem } from "@/lib/calculateSOW";
import { QuoteDocument } from "@/components/pdf/QuoteDocument";
import { escapeHtml, fmt } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rateLimit";

const resend = new Resend(process.env.RESEND_API_KEY);

function errResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  // ── Rate limiting ────────────────────────────────────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await checkRateLimit(ip, "default"))) {
    return errResponse(
      "Too many requests. Please wait a minute before trying again.",
      429,
    );
  }

  // ── Env guards ──────────────────────────────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    console.error("[send-quote] RESEND_API_KEY is not set");
    return errResponse("Email service is not configured", 503);
  }
  const salesEmail = process.env.SALES_EMAIL;
  if (!salesEmail) {
    console.error("[send-quote] SALES_EMAIL env var is not set");
    return errResponse("Recipient email is not configured", 503);
  }

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errResponse("Invalid JSON body", 400);
  }

  const parsed = QuoteFormSchema.safeParse(body);
  if (!parsed.success) {
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Validation failed",
        ...(isDev && { fieldErrors: parsed.error.flatten().fieldErrors }),
      },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // ── Recalculate server-side — never trust client-supplied items/subtotal ─
  const sowResult = calculateSOW(data);
  if (sowResult.shouldRedirect) {
    return errResponse(
      "This quote configuration requires a manual consultation.",
      422,
    );
  }
  const items: LineItem[] = sowResult.items;
  const subtotal = items.reduce(
    (sum: number, item: LineItem) => sum + item.total,
    0,
  );

  if (!data.deliveryEmail) {
    return errResponse("A delivery email address is required", 422);
  }

  const fromAddress = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
  const tag = data.isSpecQuote ? "SPEC QUOTE" : "REAL SALE";

  const fileName = `quote-${(data.eventName ?? "estimate")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}.pdf`;

  // ── Generate PDF ─────────────────────────────────────────────────────────
  // renderToBuffer is pure Node — synchronous React render → PDF bytes.
  // Returns a Buffer directly, which .toString("base64") works on.
  let pdfBuffer: Buffer;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(QuoteDocument, {
      data,
      items,
      subtotal,
    }) as any;
    pdfBuffer = await renderToBuffer(element);
  } catch (e) {
    console.error(
      "[send-quote] PDF generation failed:",
      e instanceof Error ? e.message : e,
    );
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 },
    );
  }

  const pdfBase64 = pdfBuffer.toString("base64");

  // ── HTML email body ──────────────────────────────────────────────────────
  // All user-supplied values are escaped before interpolation to prevent XSS
  // in email clients that render raw HTML.
  const safeEventName = escapeHtml(data.eventName ?? "Untitled Event");
  const safeVenueName = escapeHtml(data.venueName ?? "TBD");
  const safeEventDate = escapeHtml(
    data.hasDate && data.eventDate ? data.eventDate : "TBD",
  );
  const safeServices = escapeHtml(data.services.join(", ") || "—");
  const safeSubtotal = escapeHtml(fmt(subtotal));
  const safeTag = escapeHtml(tag);

  const htmlBody = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:system-ui,sans-serif;color:#111;max-width:600px;margin:32px auto;padding:0 20px">
  <div style="background:#0f0f0f;padding:28px 32px;border-radius:10px 10px 0 0">
    <div style="color:#fff;font-size:17px;font-weight:900;letter-spacing:-.02em">THE RECORDING SERVICE</div>
    <div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:.12em;margin-top:4px">Production Estimate</div>
  </div>
  <div style="border:1px solid #eee;border-top:none;padding:28px 32px;border-radius:0 0 10px 10px">
    <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.1em">${safeTag}</p>
    <h2 style="margin:0 0 16px;font-size:22px;font-weight:900">${safeEventName}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px">
      <tr style="background:#f5f5f5">
        <td style="padding:8px;font-weight:700;width:40%">Venue</td>
        <td style="padding:8px">${safeVenueName}</td>
      </tr>
      <tr>
        <td style="padding:8px;font-weight:700">Event Date</td>
        <td style="padding:8px">${safeEventDate}</td>
      </tr>
      <tr style="background:#f5f5f5">
        <td style="padding:8px;font-weight:700">Services</td>
        <td style="padding:8px">${safeServices}</td>
      </tr>
    </table>
    <div style="background:#0f0f0f;color:#fff;border-radius:8px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#888">Estimated Investment</div>
        <div style="font-size:10px;color:#555;margin-top:2px">VAT Inclusive · Pending Review</div>
      </div>
      <div style="font-size:28px;font-weight:900">${safeSubtotal}</div>
    </div>
    <p style="margin:20px 0 0;font-size:11px;color:#aaa">
      Your full quote is attached as a PDF. A producer will review and be in touch within 24 hours.
    </p>
  </div>
</body></html>`;

  // ── Plain text fallback ──────────────────────────────────────────────────
  const textLines = [
    `=== NEW QUOTE REQUEST (${tag}) ===`,
    "",
    `Event:  ${data.eventName ?? "Untitled"}`,
    `Venue:  ${data.venueName ?? "TBD"}`,
    `Type:   ${data.eventType}`,
    `Date:   ${data.hasDate && data.eventDate ? data.eventDate : "TBD"}`,
    `Total:  ${fmt(subtotal)}`,
    "",
    "── SERVICES ──",
    ...items.map(
      (i: LineItem) =>
        `  ${i.name} × ${i.quantity} ${i.unit} = ${fmt(i.total)}`,
    ),
    "",
    "── CONTACT ──",
    `Email: ${data.deliveryEmail}`,
    ...(data.isSpecQuote
      ? []
      : [
          `Name:  ${data.clientName ?? ""}`,
          `Phone: ${data.clientPhone ?? ""}`,
          `Org:   ${data.organization ?? ""}`,
        ]),
    ...(data.newsletterConsent ? ["", "✅ Newsletter opt-in"] : []),
    ...(data.feedback ? ["", "── FEEDBACK ──", data.feedback] : []),
  ].join("\n");

  // ── 1. Sales notification ────────────────────────────────────────────────
  const { error: salesError } = await resend.emails.send({
    from: fromAddress,
    to: [salesEmail],
    replyTo: data.deliveryEmail,
    subject: `[New Quote] ${data.eventName ?? "Untitled"} — ${fmt(subtotal)} — ${tag}`,
    text: textLines,
    attachments: [{ filename: fileName, content: pdfBase64 }],
  });

  if (salesError) {
    console.error("[send-quote] Resend error (sales):", salesError);
    return errResponse(salesError.message, 502);
  }

  // ── 2. Client copy ───────────────────────────────────────────────────────
  const { error: clientError } = await resend.emails.send({
    from: fromAddress,
    to: [data.deliveryEmail],
    subject: `Your Quote — ${data.eventName ?? "Untitled"} (${fmt(subtotal)})`,
    html: htmlBody,
    text: textLines,
    attachments: [{ filename: fileName, content: pdfBase64 }],
  });

  if (clientError) {
    console.warn("[send-quote] Client email failed (non-fatal):", clientError);
  }

  return NextResponse.json({ message: "Success" });
}
