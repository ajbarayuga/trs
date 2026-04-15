import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { LeadCaptureSchema } from "@/schema/quote";
import { escapeHtml } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rateLimit";

function errResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  // ── Rate limiting ────────────────────────────────────────────────────────
  // Uses the same "default" bucket as send-quote: 5 requests per IP per 60s.
  // Contact-sales is lower-value to attackers but still hits Resend and
  // SALES_EMAIL — it needs the same protection.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await checkRateLimit(ip, "default"))) {
    return errResponse(
      "Too many requests. Please wait a minute before trying again.",
      429,
    );
  }

  // ── Env guards ────────────────────────────────────────────────────────────
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("[contact-sales] RESEND_API_KEY is not set");
    return errResponse("Email service is not configured", 503);
  }
  const resend = new Resend(resendApiKey);
  const salesEmail = process.env.SALES_EMAIL;
  if (!salesEmail) {
    console.error("[contact-sales] SALES_EMAIL env var is not set");
    return errResponse("Recipient email is not configured", 503);
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errResponse("Invalid JSON body", 400);
  }

  // ── Validate with Zod ─────────────────────────────────────────────────────
  const parsed = LeadCaptureSchema.safeParse(body);
  if (!parsed.success) {
    // Only expose field errors in development — not in production
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

  // ── Honeypot check ────────────────────────────────────────────────────────
  // The website_url field is hidden from real users (display:none + tabIndex=-1).
  // Bots that fill every visible input will populate it. Silently reject them.
  // We return 200 so bots don't know they were caught.
  if (data.website_url && data.website_url.length > 0) {
    console.warn("[contact-sales] Honeypot triggered — silent reject");
    return NextResponse.json({ message: "Success" });
  }

  // ── Build email bodies ────────────────────────────────────────────────────
  // All user-supplied values are escaped before HTML interpolation.
  const safeName = escapeHtml(`${data.firstName} ${data.lastName}`);
  const safeEmail = escapeHtml(data.email);
  const safeSubject = escapeHtml(data.subject);
  const safeMessage = escapeHtml(data.message);

  // Plain text (sales notification)
  const textBody = [
    `=== NEW CONTACT-SALES INQUIRY ===`,
    "",
    `From:    ${data.firstName} ${data.lastName}`,
    `Email:   ${data.email}`,
    `Subject: ${data.subject}`,
    "",
    "── Message ──",
    data.message,
  ].join("\n");

  // HTML (sales notification — richer formatting)
  const htmlBody = `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:system-ui,sans-serif;color:#111;max-width:600px;margin:32px auto;padding:0 20px">
  <div style="background:#0f0f0f;padding:24px 28px;border-radius:10px 10px 0 0">
    <div style="color:#fff;font-size:16px;font-weight:900;letter-spacing:-.02em">THE RECORDING SERVICE</div>
    <div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:.12em;margin-top:4px">New Sales Inquiry</div>
  </div>
  <div style="border:1px solid #eee;border-top:none;padding:24px 28px;border-radius:0 0 10px 10px">
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px">
      <tr style="background:#f5f5f5">
        <td style="padding:8px;font-weight:700;width:30%">Name</td>
        <td style="padding:8px">${safeName}</td>
      </tr>
      <tr>
        <td style="padding:8px;font-weight:700">Email</td>
        <td style="padding:8px"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
      </tr>
      <tr style="background:#f5f5f5">
        <td style="padding:8px;font-weight:700">Subject</td>
        <td style="padding:8px">${safeSubject}</td>
      </tr>
    </table>
    <div style="background:#f8f8f8;border-left:3px solid #0f0f0f;padding:14px 16px;border-radius:4px;font-size:13px;line-height:1.6;white-space:pre-wrap">${safeMessage}</div>
    <p style="margin:16px 0 0;font-size:11px;color:#aaa">Reply directly to this email to respond to the inquiry.</p>
  </div>
</body></html>`;

  // ── Send sales notification ───────────────────────────────────────────────
  try {
    const { error: salesError } = await resend.emails.send({
      from: process.env.FROM_EMAIL ?? "onboarding@resend.dev",
      to: [salesEmail],
      replyTo: data.email,
      subject: `[Sales Inquiry] ${data.subject} — ${data.firstName} ${data.lastName}`,
      text: textBody,
      html: htmlBody,
    });

    if (salesError) {
      console.error("[contact-sales] Resend error (sales):", salesError);
      return errResponse(salesError.message, 502);
    }

    // ── Send confirmation to the submitter ──────────────────────────────────
    // Non-fatal: if this fails, the sales team already got their notification.
    const { error: confirmError } = await resend.emails.send({
      from: process.env.FROM_EMAIL ?? "onboarding@resend.dev",
      to: [data.email],
      subject: `We received your message — The Recording Service`,
      text: [
        `Hi ${data.firstName},`,
        "",
        "Thanks for reaching out. We received your message and a producer will be in touch shortly.",
        "",
        "── Your Message ──",
        data.message,
        "",
        "— The Recording Service Team",
        "contact@therecordingservice.com",
        "404-333-8901",
      ].join("\n"),
    });

    if (confirmError) {
      console.warn(
        "[contact-sales] Confirmation email failed (non-fatal):",
        confirmError,
      );
    }

    return NextResponse.json({ message: "Success" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[contact-sales] Unexpected error:", message);
    return errResponse("Internal Server Error", 500);
  }
}
