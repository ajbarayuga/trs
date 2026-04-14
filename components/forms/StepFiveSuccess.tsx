"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FileDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { QuoteFormData } from "@/schema/quote";
import type { LineItem } from "@/lib/calculateSOW";

interface StepFiveSuccessProps {
  onReset?: () => void;
  quoteData: QuoteFormData;
  items: LineItem[];
  subtotal: number;
  warning?: string;
  refNumber: string;
}

export function StepFiveSuccess({
  quoteData,
  items,
  subtotal,
  warning,
  refNumber,
}: StepFiveSuccessProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingWord, setDownloadingWord] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async (format: "pdf" | "docx") => {
    if (format === "pdf") setDownloadingPdf(true);
    if (format === "docx") setDownloadingWord(true);
    setDownloadError(null);

    try {
      const endpoint =
        format === "pdf" ? "/api/generate-pdf" : "/api/generate-docx";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...quoteData, items, subtotal }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileBase = `quote-${(quoteData.eventName ?? "estimate")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`;
      a.download = `${fileBase}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(
        err instanceof Error
          ? err.message
          : "Download failed. Please try again.",
      );
    } finally {
      if (format === "pdf") setDownloadingPdf(false);
      if (format === "docx") setDownloadingWord(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500 pb-12 text-center">
      {/* ── Producer note — FIRST element per client feedback ── */}
      <div className="p-8 bg-primary text-primary-foreground rounded-sm space-y-2 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight">
          A Producer is reviewing your request.
        </h2>
        <p className="text-sm opacity-70 leading-relaxed">
          A producer or tech will reach out to you ASAP to fine-tune your quote
          details.
        </p>
      </div>

      {/* ── Quote Sent confirmation ── */}
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center mb-2">
          <CheckCircle2 className="w-10 h-10 text-primary animate-bounce" />
        </div>
        <h2 className="text-5xl font-black tracking-tighter uppercase">
          Quote Sent!
        </h2>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
          <span className="text-sm text-muted-foreground font-black uppercase tracking-widest">
            Ref:
          </span>
          <span className="text-sm font-black tracking-widest text-foreground">
            {refNumber}
          </span>
        </div>
        <p className="text-muted-foreground text-md max-w-md mx-auto leading-relaxed">
          Check your inbox. Your custom estimate is flying your way.
        </p>
        {warning && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 max-w-sm mx-auto">
            ⚠️ {warning}
          </div>
        )}
      </div>

      {/* ── Action cards ── */}
      <div className="max-w-md mx-auto text-left">
        <Card className="p-6 border-2 border-dashed bg-muted/20 space-y-3">
          <div className="w-8 h-8 rounded-sm bg-background flex items-center justify-center">
            <FileDown className="w-10 h-10 text-primary" />
          </div>
          <h4 className="font-bold uppercase tracking-tight text-lg text-primary">
            Download Files
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Need editable output? Download both the PDF and a Word (.docx)
            version of this estimate.
          </p>
          {downloadError && (
            <p className="text-[10px] text-destructive font-medium">
              {downloadError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handleDownload("pdf")}
              disabled={downloadingPdf || downloadingWord}
              className="w-full text-[10px] bg-blue-900 text-white hover:bg-blue-800 hover:text-white font-black uppercase tracking-widest rounded-lg h-8 flex items-center justify-center gap-2"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  PDF...
                </>
              ) : (
                "PDF"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownload("docx")}
              disabled={downloadingPdf || downloadingWord}
              className="w-full text-[10px] bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white font-black uppercase tracking-widest rounded-lg h-8 flex items-center justify-center gap-2"
            >
              {downloadingWord ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  WORD...
                </>
              ) : (
                "WORD"
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* ── Production notes ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
        <div className="p-4 border border-border/50 rounded-2xl bg-muted/20 flex gap-3 items-start">
          <span className="text-base mt-0.5">📋</span>
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider">
              ROS Requirement
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Final Run of Show must be submitted 3 business days prior to your
              event.
            </p>
          </div>
        </div>
        <div className="p-4 border border-border/50 rounded-2xl bg-muted/20 flex gap-3 items-start">
          <span className="text-base mt-0.5">🖥️</span>
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider">
              Built-in Tech
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Broken venue tech discovered on production day will require a
              revised quote.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
