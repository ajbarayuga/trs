import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Packer } from "docx";
import { QuoteFormSchema } from "@/schema/quote";
import { calculateSOW } from "@/lib/calculateSOW";
import { checkRateLimit } from "@/lib/rateLimit";
import { buildQuoteDocxDocument } from "@/lib/buildQuoteDocx";

export async function POST(req: NextRequest) {
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
  const sowResult = calculateSOW(data);
  if (sowResult.shouldRedirect) {
    return NextResponse.json(
      { error: "This quote requires a manual consultation." },
      { status: 422 },
    );
  }

  const items = sowResult.items;
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  const doc = buildQuoteDocxDocument(data, items, subtotal);
  const docxBuffer = await Packer.toBuffer(doc);
  const fileName = `quote-${(data.eventName ?? "estimate")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}.docx`;

  const bytes = new Uint8Array(docxBuffer.length);
  bytes.set(docxBuffer);
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(bytes.length),
    },
  });
}
