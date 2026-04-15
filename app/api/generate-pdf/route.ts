import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { QuoteFormSchema } from "@/schema/quote";
import { calculateSOW, type LineItem } from "@/lib/calculateSOW";
import { QuoteDocument } from "@/components/pdf/QuoteDocument";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // ── Rate limiting ────────────────────────────────────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await checkRateLimit(ip, "pdf"))) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
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

  // Recalculate server-side — never trust client-supplied items/subtotal
  const sowResult = calculateSOW(data);
  if (sowResult.shouldRedirect) {
    return NextResponse.json(
      { error: "This quote requires a manual consultation." },
      { status: 422 },
    );
  }
  const items: LineItem[] = sowResult.items;
  const subtotal = items.reduce(
    (sum: number, item: LineItem) => sum + item.total,
    0,
  );

  // renderToBuffer expects ReactElement<DocumentProps>.
  // Cast through unknown to satisfy the type without changing runtime behaviour.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(QuoteDocument, {
    data,
    items,
    subtotal,
  }) as any;
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(element);
  } catch (e) {
    console.error(
      "[generate-pdf] PDF generation failed:",
      e instanceof Error ? e.message : e,
    );
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 },
    );
  }

  const fileName = `quote-${(data.eventName ?? "estimate")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}.pdf`;

  // Copy into a standalone Uint8Array — Buffer.buffer may span extra bytes and
  // corrupt the file when passed directly as ArrayBuffer to Response.
  const bytes = new Uint8Array(pdfBuffer.length);
  bytes.set(pdfBuffer);
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(bytes.length),
    },
  });
}
