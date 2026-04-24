"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuoteFormSchema, type QuoteFormData } from "@/schema/quote";
import { calculateSOW, type LineItem } from "@/lib/calculateSOW";
import { ProgressBar } from "@/components/forms/ProgressBar";
import NotSure from "@/components/forms/NotSure";
import { StepTwo } from "@/components/forms/StepTwo";
import { StepThree } from "@/components/forms/StepThree";
import { StepFourAV } from "@/components/forms/StepFourAV";
import { StepFourSummary } from "@/components/forms/StepFourSummary";
import { StepFiveSuccess } from "@/components/forms/StepFiveSuccess";

import { SiteFooter } from "@/components/ui/site-footer";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calculator,
  MessageSquare,
  ChevronLeft,
  ArrowRight,
  Loader2,
  Send,
  AlertCircle,
} from "lucide-react";

// Steps:
//  1 = Start
//  2 = Time & Place
//  3 = Video Services
//  4 = Audio & AV
//  5 = Summary (It's All About You + quote)
//  6 = Success

interface QuoteSnapshot {
  data: QuoteFormData;
  items: LineItem[];
  subtotal: number;
  warning?: string;
  refNumber: string;
}

// Generates a short human-readable reference number e.g. TRS-2025-A3F9
function generateRefNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRS-${year}-${rand}`;
}

export default function QuotePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [path, setPath] = useState<"choose" | "quote" | "not-sure">("choose");
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<QuoteSnapshot | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  const methods = useForm<QuoteFormData>({
    resolver: zodResolver(QuoteFormSchema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      eventType: "live",
      hasDate: false,
      eventDate: "",
      isMultiDay: false,
      venueType: "single",
      setting: "indoor",
      locationType: "office",
      startTime: "09:00",
      doorsTime: "08:30",
      hasDuration: false,
      durationHours: 4,
      studioHasDuration: false,
      studioDurationHours: 4,
      studioLocationType: "office",
      builtInAV: [],
      services: [],
      isZoomOnly: false,
      cameraSource: "bring",
      cameraCount: "1",
      streamGraphics: false,
      diyStream: false,
      videoTypes: [],
      videoBuiltInEnabled: false,
      videoBuiltInEditing: [],
      videoBuiltInRawFootage: false,
      videoBuiltInSocialShortsCount: 0,
      videoTRSEnabled: false,
      videoTRSCameraAngles: 1,
      videoTRSEditing: [],
      videoTRSRawFootage: false,
      videoTRSSocialShortsCount: 0,
      webVideoPeople: 1,
      webVideoCount: 1,
      webVideoDuration: 3,
      podcastEpisodes: 1,
      podcastDuration: 1,
      highlightSessions: 1,
      highlightDurationHours: 4,
      lectureTalksCount: 1,
      lectureTalkDuration: "up to 1hr",
      lecturePPT: false,
      lectureFromStream: false,
      additionalAngles: false,
      angleCount: 0,
      wantsSocialShorts: false,
      socialShortsCount: 0,
      shortsSource: "recut",
      audioServices: [],
      micWirelessComboKits: 0,
      micWiredMicKits: 0,
      micGooseneckMics: 0,
      micRockBand: false,
      micNotSure: false,
      playbackEnabled: false,
      vogEnabled: false,
      vogAlreadyCounted: false,
      monitorsEnabled: false,
      monitors: 0,
      attendance: 0,
      wantsProjector: false,
      projectorScreenCount: 1,
      wantsTVs: false,
      tvCount: 1,
      wantsConfidenceMonitors: false,
      confidenceMonitorCount: 1,
      lightingServices: [],
      stageWashWidth: 10,
      wirelessUplightCount: 6,
      photographyServices: [],
      eventName: "Untitled Event",
      isSpecQuote: false,
      venueName: "",
      clientName: "",
      clientPhone: "",
      organization: "",
      hasAdditionalPOC: false,
      deliveryEmail: "",
      newsletterConsent: false,
      feedback: "",
    },
  });

  const { watch, handleSubmit, reset, getValues } = methods;
  const formData = watch();
  const lastAutoSaveFingerprintRef = useRef<string | null>(null);

  // ── Mount / loading state ────────────────────────────────────────────────
  // Prevents SSR hydration flash — page only renders after client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Quote save / resume (localStorage) ──────────────────────────────────
  const STORAGE_KEY = "trs_quote_draft";

  // Restore saved draft on mount
  // Never restore step 6 — snapshot is lost on refresh so the success
  // screen can't render. Drop the user back to step 1 instead.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { step, values } = JSON.parse(saved);
        const safeStep = !step || step >= 6 ? 1 : step;
        reset(values);
        setCurrentStep(safeStep);
        setPath("quote");
        setHasSavedProgress(true);
      }
    } catch {
      /* ignore corrupted storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save progress — only steps 2–5, never step 6 (success screen)
  // Step 6 snapshot lives only in memory and can't survive a refresh anyway
  // Fingerprint values so we do not setState when watch() re-renders with the same data.
  useEffect(() => {
    if (path !== "quote" || currentStep < 2 || currentStep >= 6) return;
    try {
      const values = getValues();
      const fingerprint = JSON.stringify({ step: currentStep, values });
      if (lastAutoSaveFingerprintRef.current === fingerprint) return;
      lastAutoSaveFingerprintRef.current = fingerprint;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ step: currentStep, values, savedAt: Date.now() }),
      );
      setHasSavedProgress((prev) => (prev ? prev : true));
    } catch {
      /* ignore storage errors */
    }
  }, [formData, currentStep, path, getValues]);

  // ── Redirect modal state ─────────────────────────────────────────────────
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  // Suppresses re-trigger after cancel until user changes their selection
  const suppressRedirect = useRef(false);
  // Tracks false→true transition to avoid re-firing while modal is open
  const prevShouldRedirect = useRef(false);

  const handleRedirect = useCallback(() => {
    suppressRedirect.current = false;
    prevShouldRedirect.current = false;
    setShowRedirectModal(false);
    setPath("not-sure");
    setCurrentStep(1);
    reset();
  }, [reset]);

  const handleRedirectRequest = useCallback(() => {
    if (suppressRedirect.current) return;
    setShowRedirectModal(true);
  }, []);

  const handleRedirectCancel = useCallback(() => {
    // Revert whichever field(s) triggered the redirect back to safe defaults
    // so the UI shows the previous non-triggering selection
    const v = methods.getValues();
    if (v.eventType === "other") methods.setValue("eventType", "live");
    if (v.venueType === "multiple") methods.setValue("venueType", "single");
    if (v.locationType === "rented") methods.setValue("locationType", "office");
    if (v.studioLocationType === "studio-rental")
      methods.setValue("studioLocationType", "office");
    if (v.isMultiDay) methods.setValue("isMultiDay", false);
    if (
      v.cameraCount === "2+ (call sales)" ||
      v.cameraCount === "not sure (call sales)"
    )
      methods.setValue("cameraCount", "1");
    if (v.lectureTalkDuration === "longer (call sales)")
      methods.setValue("lectureTalkDuration", "up to 1hr");
    if (v.audioServices?.includes("band"))
      methods.setValue(
        "audioServices",
        v.audioServices.filter((s: string) => s !== "band"),
      );
    if (v.audioServices?.includes("recording"))
      methods.setValue(
        "audioServices",
        v.audioServices.filter((s: string) => s !== "recording"),
      );
    // webVideo thresholds
    if (v.webVideoCount > 12) methods.setValue("webVideoCount", 12);
    if (v.webVideoDuration > 3) methods.setValue("webVideoDuration", 3);
    // attendance threshold
    if ((v.attendance ?? 0) > 400) methods.setValue("attendance", 400);

    suppressRedirect.current = true;
    setShowRedirectModal(false);
  }, [methods]);

  const handleExit = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSavedProgress(false);
    setPath("choose");
    setCurrentStep(1);
    setSubmitStatus("idle");
    setSubmitError(null);
    setSnapshot(null);
    reset();
  }, [reset]);

  const isVideoActive = formData.services.includes("video");
  // Studio web-video uses legacy videoTypes field
  const studioVideoTypes = isVideoActive ? (formData.videoTypes ?? []) : [];
  // Live lecture: check new camera-source fields
  const builtInEditingActive =
    isVideoActive && (formData.videoBuiltInEnabled ?? false)
      ? (formData.videoBuiltInEditing ?? [])
      : [];
  const trsEditingActive =
    isVideoActive && (formData.videoTRSEnabled ?? false)
      ? (formData.videoTRSEditing ?? [])
      : [];
  const hasLectureActive =
    builtInEditingActive.includes("lecture") ||
    trsEditingActive.includes("lecture");

  const shouldRedirectToSales =
    formData.eventType === "other" ||
    formData.venueType === "multiple" ||
    formData.locationType === "rented" ||
    formData.studioLocationType === "studio-rental" ||
    formData.isMultiDay === true ||
    (studioVideoTypes.includes("web-video") &&
      (formData.webVideoCount > 12 || formData.webVideoDuration > 3)) ||
    (formData.services.includes("streaming") &&
      (formData.cameraCount === "2+ (call sales)" ||
        formData.cameraCount === "not sure (call sales)")) ||
    (hasLectureActive &&
      formData.lectureTalkDuration === "longer (call sales)") ||
    formData.audioServices.includes("band") ||
    formData.audioServices.includes("recording") ||
    (formData.audioServices.includes("pa") && (formData.attendance ?? 0) > 400);

  useEffect(() => {
    if (!shouldRedirectToSales) {
      suppressRedirect.current = false;
      prevShouldRedirect.current = false;
      return;
    }
    // Only fire on false→true transition and not while modal is already open
    if (
      path === "quote" &&
      !showRedirectModal &&
      !suppressRedirect.current &&
      !prevShouldRedirect.current
    ) {
      handleRedirectRequest();
    }
    prevShouldRedirect.current = true;
  }, [shouldRedirectToSales, path, showRedirectModal, handleRedirectRequest]);

  const stepLabel = (step: number) => {
    switch (step) {
      case 1:
        return "Get Started";
      case 2:
        return "Time & Place";
      case 3:
        return "Video Services";
      case 4:
        return "Audio & AV";
      case 5:
        return "Summary";
      default:
        return "";
    }
  };

  const onSubmit = async (data: QuoteFormData) => {
    setSubmitStatus("loading");
    setSubmitError(null);

    const result = calculateSOW(data);
    const items: LineItem[] = result?.items ?? [];
    const shouldRedirect: boolean = result?.shouldRedirect ?? false;
    if (shouldRedirect) {
      setSubmitStatus("idle");
      handleRedirect();
      return;
    }
    const subtotal = items.reduce(
      (sum: number, item: LineItem) => sum + item.total,
      0,
    );

    if (subtotal <= 0) {
      setSubmitError(
        "Your quote total is $0. Select at least one paid service or add-on before sending.",
      );
      setSubmitStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/send-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, items, subtotal }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server error ${res.status}`);
      }

      const body = await res.json().catch(() => ({}));
      localStorage.removeItem(STORAGE_KEY);
      setSnapshot({
        data,
        items,
        subtotal,
        warning: body?.warning,
        refNumber: generateRefNumber(),
      });
      setSubmitStatus("idle");
      setCurrentStep(6);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
      setSubmitStatus("error");
    }
  };

  return (
    <main className="min-h-screen pb-24 bg-background">
      {/* ── Loading state — prevents SSR hydration flash ────────────────── */}
      {!isMounted && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Loading…
            </p>
          </div>
        </div>
      )}

      {isMounted && (
        <>
          {path === "quote" && (
            <ProgressBar
              currentStep={currentStep}
              isFinished={currentStep === 6}
            />
          )}

          <div className="container max-w-3xl pt-20 mx-auto px-2 px-md-0">
            {/* ── CHOOSE ─────────────────────────────────────────────────────── */}
            {path === "choose" && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 text-center">
                {/* Resume banner — shown if user has a saved draft */}
                {hasSavedProgress && (
                  <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl text-left animate-in fade-in">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-primary">
                        Draft saved
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        You have a quote in progress.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPath("quote");
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                      >
                        Resume →
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem(STORAGE_KEY);
                          setHasSavedProgress(false);
                          reset();
                        }}
                        className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <h1 className="text-5xl font-bold tracking-tight text-foreground uppercase">
                    Get a Quote
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Choose the best path for your project.
                  </p>
                </div>
                <div className="grid gap-6 text-left">
                  <Card
                    onClick={() => setPath("quote")}
                    className="group cursor-pointer p-8 hover:border-primary/50 transition-all shadow-sm hover:shadow-xl"
                  >
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <Calculator className="h-7 w-7" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold">
                          Guided Estimator
                        </CardTitle>
                        <CardDescription>
                          Automated quote for standard setups.
                        </CardDescription>
                      </div>
                      <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2.5 group-hover:translate-x-0" />
                    </div>
                  </Card>

                  <Card
                    onClick={() => setPath("not-sure")}
                    className="group cursor-pointer p-8 hover:border-foreground/50 transition-all shadow-sm hover:shadow-xl"
                  >
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
                        <MessageSquare className="h-7 w-7" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold">
                          Manual Inquiry
                        </CardTitle>
                        <CardDescription>
                          Custom support for complex productions.
                        </CardDescription>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* ── NOT SURE ───────────────────────────────────────────────────── */}
            {path === "not-sure" && (
              <div className="animate-in fade-in duration-500">
                <Button
                  variant="ghost"
                  onClick={() => setPath("choose")}
                  className="mb-8 font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back to selection
                </Button>
                <Card className="rounded-4xl overflow-hidden border-border/50 shadow-2xl">
                  <CardHeader className="bg-muted/20 p-8 border-b">
                    <CardTitle className="text-3xl font-bold">
                      Contact Sales
                    </CardTitle>
                    <CardDescription>
                      Your project requires a custom consultation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <NotSure />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── QUOTE ─────────────────────────────────────────────────────── */}
            {path === "quote" && (
              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                  {currentStep < 6 && (
                    <div className="flex justify-between items-end animate-in fade-in">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                          Step 0{currentStep}
                        </p>
                        <h2 className="text-4xl font-bold">
                          {stepLabel(currentStep)}
                        </h2>
                      </div>
                      <div className="flex items-center gap-3">
                        {currentStep >= 2 && hasSavedProgress && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                            Progress saved
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleExit}
                          className="rounded-full h-8 opacity-50 hover:opacity-100 px-4 text-[10px] font-bold uppercase tracking-widest"
                        >
                          Exit
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 1 — Start */}
                  {currentStep === 1 && (
                    <Card className="p-20 text-center border-dashed border-2 bg-muted/5 rounded-[3rem] animate-in zoom-in-95 duration-500">
                      <p className="text-xl mb-10 text-muted-foreground font-medium">
                        Venue Equipment Check
                      </p>
                      <Button
                        type="button"
                        size="lg"
                        className="px-12 h-16 text-lg font-bold rounded-full shadow-2xl shadow-primary/20 transition-all active:scale-95"
                        onClick={() => setCurrentStep(2)}
                      >
                        Begin <ArrowRight className="ml-3 w-6 h-6" />
                      </Button>
                    </Card>
                  )}

                  {/* Step 2 — Time & Place */}
                  {currentStep === 2 && (
                    <div className="animate-in fade-in duration-700">
                      <StepTwo onRedirect={handleRedirectRequest} />
                      <div className="flex justify-between mt-16 pt-8 border-t border-border/50">
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="font-bold text-muted-foreground"
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="px-12 h-12 rounded-full font-bold"
                        >
                          Next: Video Services
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 — Video Services */}
                  {currentStep === 3 && (
                    <div className="animate-in fade-in duration-700">
                      <StepThree onRedirect={handleRedirectRequest} />
                      <div className="flex justify-between mt-16 pt-8 border-t border-border/50">
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="font-bold text-muted-foreground"
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          className="px-12 h-12 rounded-full font-bold shadow-lg"
                        >
                          Next: Audio & AV
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 4 — Audio & AV */}
                  {currentStep === 4 && (
                    <div className="animate-in fade-in duration-700">
                      <StepFourAV onRedirect={handleRedirectRequest} />
                      <div className="flex justify-between mt-16 pt-8 border-t border-border/50">
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="font-bold text-muted-foreground"
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setCurrentStep(5)}
                          className="px-12 h-12 rounded-full font-bold shadow-lg"
                        >
                          Next: Summary
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 5 — Summary */}
                  {currentStep === 5 && (
                    <div className="animate-in fade-in duration-700">
                      <StepFourSummary onRedirect={handleRedirectRequest} />

                      {submitStatus === "error" && submitError && (
                        <Alert
                          variant="destructive"
                          className="mt-6 rounded-2xl"
                        >
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-between mt-8 pt-8 border-t border-border/50">
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          className="font-bold text-muted-foreground"
                          disabled={submitStatus === "loading"}
                        >
                          Back to Audio & AV
                        </Button>
                        <Button
                          type="submit"
                          disabled={submitStatus === "loading"}
                          className="px-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-500/20 transition-all active:scale-95 font-bold flex items-center gap-2"
                        >
                          {submitStatus === "loading" ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending…
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Generate Quote
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 6 — Success */}
                  {currentStep === 6 && snapshot && (
                    <div className="animate-in zoom-in-95 duration-500">
                      <StepFiveSuccess
                        quoteData={snapshot.data}
                        items={snapshot.items}
                        subtotal={snapshot.subtotal}
                        warning={snapshot.warning}
                        refNumber={snapshot.refNumber}
                      />
                    </div>
                  )}
                </form>
              </FormProvider>
            )}
          </div>

          {/* ── Redirect confirmation modal ──────────────────────────────────── */}
          {showRedirectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={handleRedirectCancel}
              />
              {/* Modal */}
              <div className="relative bg-background rounded-4xl border border-border/50 shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 fade-in duration-200">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-6">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-black uppercase tracking-tight mb-3">
                  This requires a consultation
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                  The option you selected is outside our automated estimator. A
                  producer will need to review this manually.
                </p>
                <p className="text-xs text-muted-foreground/70 leading-relaxed mb-8">
                  <strong className="text-foreground">Heads up:</strong>{" "}
                  Continuing to Contact Sales will clear your current quote
                  progress. You can cancel to stay in the Guided Estimator and
                  change your selection.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleRedirectCancel}
                    className="flex-1 py-3 px-6 rounded-full border-2 border-border font-bold text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all"
                  >
                    ← Stay in Estimator
                  </button>
                  <button
                    type="button"
                    onClick={handleRedirect}
                    className="flex-1 py-3 px-6 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
                  >
                    Contact Sales →
                  </button>
                </div>
              </div>
            </div>
          )}

          <SiteFooter />
        </>
      )}
    </main>
  );
}
