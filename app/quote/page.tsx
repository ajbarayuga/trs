"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QuoteFormSchema, type QuoteFormData } from "@/schema/quote";
import { calculateSOW, type LineItem } from "@/lib/calculateSOW";
import { shouldRedirectToSales } from "@/lib/quoteRedirect";
import { DEFAULT_DOORS_TIME, DEFAULT_START_TIME } from "@/lib/quoteDefaults";
import { ProgressBar } from "@/components/forms/ProgressBar";
import NotSure from "@/components/forms/NotSure";
import { StepTwo, VenueEquipmentCheck } from "@/components/forms/StepTwo";
import { StepThree } from "@/components/forms/StepThree";
import { StepFourAV } from "@/components/forms/StepFourAV";
import { StepFiveDetails } from "@/components/forms/StepFourSummary";
import { StepFiveSuccess } from "@/components/forms/StepFiveSuccess";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CtaButton } from "@/components/ui/cta-button";
import { SiteFooter } from "@/components/ui/site-footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronLeft,
  ArrowRight,
  Loader2,
  Send,
  AlertCircle,
} from "lucide-react";

// ─── Step map ──────────────────────────────────────────────────────────────────
//  1 = Start
//  2 = Services  ← Event Type + ALL service selection (streaming, video, AV, lighting, photo)
//  3 = Details   ← Time & Place + It's All About You + quote preview
//  4 = Send      ← Success / confirmation
// ─────────────────────────────────────────────────────────────────────────────

interface QuoteSnapshot {
  data: QuoteFormData;
  items: LineItem[];
  subtotal: number;
  warning?: string;
  refNumber: string;
}

function generateRefNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRS-${year}-${rand}`;
}

export default function QuotePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxVisitedStep, setMaxVisitedStep] = useState(1);
  const [path, setPath] = useState<"choose" | "quote" | "not-sure">("quote");
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
      hasShowTimes: false,
      locationType: "office",
      // Default times are shared with schema defaults to avoid drift.
      // StepFiveDetails shows these with a "defaults if blank" hint.
      // calculateSOW uses durationHours (not raw time strings) for pricing,
      // so these defaults only affect the PDF workplan display.
      startTime: DEFAULT_START_TIME,
      hasDifferentDoorsTime: false,
      doorsTime: DEFAULT_DOORS_TIME,
      hasEndTime: false,
      endTime: "",
      hasMinglingCocktailHour: false,
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

  // ── Mount guard — prevents SSR hydration flash ───────────────────────────
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── localStorage draft save / restore ────────────────────────────────────
  const STORAGE_KEY = "trs_quote_draft";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && parsed.values) {
          const safeStep = !parsed.step || parsed.step >= 4 ? 1 : parsed.step;
          reset(parsed.values);
          setCurrentStep(safeStep);
          setMaxVisitedStep(safeStep);
          setPath("quote");
          setHasSavedProgress(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save steps 2–3 only (fingerprinted so we do not setState on identical form snapshots)
  useEffect(() => {
    if (path !== "quote" || currentStep < 2 || currentStep >= 4) return;
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
      /* ignore */
    }
  }, [formData, currentStep, path, getValues]);

  // ── Redirect modal ───────────────────────────────────────────────────────
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const suppressRedirect = useRef(false);
  const prevShouldRedirect = useRef(false);

  const handleRedirect = useCallback(() => {
    suppressRedirect.current = false;
    prevShouldRedirect.current = false;
    setShowRedirectModal(false);
    setPath("not-sure");
    setCurrentStep(1);
    setMaxVisitedStep(1);
    reset();
  }, [reset]);

  const handleRedirectRequest = useCallback(() => {
    if (suppressRedirect.current) return;
    setShowRedirectModal(true);
  }, []);

  const handleRedirectCancel = useCallback(() => {
    const v = methods.getValues();

    // ── Fields that are still on StepTwo (step 2) ──────────────────────────
    if (v.eventType === "other") methods.setValue("eventType", "live");

    // ── Fields moved to StepFourSummary (step 5) ───────────────────────────
    if (v.isMultiDay) methods.setValue("isMultiDay", false);
    if (v.venueType === "multiple") methods.setValue("venueType", "single");
    if (v.studioLocationType === "studio-rental")
      methods.setValue("studioLocationType", "office");

    // ── Fields on StepThree (step 3) ──────────────────────────────────────
    if (
      v.cameraCount === "2+ (call sales)" ||
      v.cameraCount === "not sure (call sales)"
    )
      methods.setValue("cameraCount", "1");
    if (v.lectureTalkDuration === "longer (call sales)")
      methods.setValue("lectureTalkDuration", "up to 1hr");
    if (v.videoTypes?.includes("concert") || v.videoTypes?.includes("other")) {
      methods.setValue(
        "videoTypes",
        v.videoTypes.filter((t: string) => t !== "concert" && t !== "other"),
      );
    }
    if (v.webVideoCount > 12) methods.setValue("webVideoCount", 12);
    if (v.webVideoDuration > 3) methods.setValue("webVideoDuration", 3);

    // ── Fields on StepFourAV (step 4) ─────────────────────────────────────
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
    if ((v.attendance ?? 0) > 400) methods.setValue("attendance", 400);

    suppressRedirect.current = true;
    setShowRedirectModal(false);
  }, [methods]);

  /** Navigate to a step, update the high-water mark, and scroll to top. */
  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
    setMaxVisitedStep((prev) => Math.max(prev, step));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const shouldRedirect = shouldRedirectToSales(formData);

  useEffect(() => {
    if (!shouldRedirect) {
      suppressRedirect.current = false;
      prevShouldRedirect.current = false;
      return;
    }
    if (
      path === "quote" &&
      !showRedirectModal &&
      !suppressRedirect.current &&
      !prevShouldRedirect.current
    ) {
      handleRedirectRequest();
    }
    prevShouldRedirect.current = true;
  }, [shouldRedirect, path, showRedirectModal, handleRedirectRequest]);

  const stepLabel = (step: number) => {
    switch (step) {
      case 1: return "Get Started";
      case 2: return "Services";
      case 3: return "Details";
      default: return "";
    }
  };

  // ── Form submit ──────────────────────────────────────────────────────────
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
      goToStep(4);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
      setSubmitStatus("error");
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen pb-0 bg-background">
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
              isFinished={currentStep === 4}
              maxVisitedStep={maxVisitedStep}
              onStepClick={goToStep}
            />
          )}

          <div className="container max-w-3xl pt-10 mx-auto px-2">
            {/* ── NOT SURE ─────────────────────────────────────────────── */}
            {path === "not-sure" && (
              <div className="animate-in fade-in duration-500">
                <Button
                  variant="ghost"
                  onClick={() => {
                    window.location.href = "/";
                  }}
                  className="mb-8 font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back to home
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

            {/* ── QUOTE ────────────────────────────────────────────────── */}
            {path === "quote" && (
              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                  {currentStep < 4 && (
                    <div className="flex justify-between items-end animate-in fade-in">
                      <div className="space-y-1">
                        <p className="text-[14px] font-black uppercase text-blue-900">
                          Step 0{currentStep}
                        </p>
                        <h2 className="text-4xl font-bold">
                          {stepLabel(currentStep)}
                        </h2>
                      </div>
                      <div className="flex items-center gap-3">
                        {currentStep >= 2 && hasSavedProgress && (
                          <span className="text-[12px] font-bold uppercase tracking-widest text-green-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-700 inline-block" />
                            Progress saved
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 1 — Start */}
                  {currentStep === 1 && (
                    <div className="animate-in zoom-in-95 duration-500 space-y-8">
                      <VenueEquipmentCheck />
                      <div className="flex justify-center">
                        <CtaButton type="button" onClick={() => goToStep(2)}>
                          Begin <ArrowRight className="w-5 h-5" />
                        </CtaButton>
                      </div>
                    </div>
                  )}

                  {/* Step 2 — Services (Event Type + Streaming + Video + AV + Lighting + Photo) */}
                  {currentStep === 2 && (
                    <div className="animate-in fade-in duration-700">
                      <StepTwo />
                      {formData.eventType === "studio" ? (
                        <Card className="mt-6 border-2 border-dashed rounded-sm bg-muted/20">
                          <CardContent className="p-8 text-center space-y-2">
                            <p className="text-lg font-black uppercase tracking-tight">
                              Under Construction
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Studio-Style Recording options are being revised and
                              will be available soon.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <StepThree onRedirect={handleRedirectRequest} />
                          <StepFourAV onRedirect={handleRedirectRequest} />
                        </>
                      )}
                      <div className="flex justify-between mt-0 pt-8">
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => goToStep(1)}
                          className="font-bold text-muted-foreground"
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          onClick={() => goToStep(3)}
                          className="px-12 h-12 font-bold bg-blue-900 border-blue-900 rounded-sm uppercase"
                        >
                          Next: Details
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 — Details (Time & Place + Contact + Quote) */}
                  {currentStep === 3 && (
                    <div className="animate-in fade-in duration-700">
                      <StepFiveDetails onRedirect={handleRedirectRequest} />

                      {submitStatus === "error" && submitError && (
                        <Alert
                          variant="destructive"
                          className="mt-6 rounded-2xl"
                        >
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{submitError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-between mt-8 pt-8">
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => goToStep(2)}
                          className="font-bold text-muted-foreground"
                          disabled={submitStatus === "loading"}
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={submitStatus === "loading"}
                          className="px-12 h-12 rounded-xs bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-500/20 transition-all active:scale-95 font-bold flex items-center gap-2"
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

                  {/* Step 4 — Send / Success */}
                  {currentStep === 4 && snapshot && (
                    <div className="animate-in zoom-in-95 duration-500">
                      <StepFiveSuccess
                        onReset={handleRedirect}
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

          {/* ── Redirect confirmation modal ──────────────────────────── */}
          {showRedirectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={handleRedirectCancel}
              />
              <div className="relative bg-background rounded-sm border border-border/50 shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 fade-in duration-200">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-6">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
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
