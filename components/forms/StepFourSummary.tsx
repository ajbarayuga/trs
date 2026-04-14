"use client";

import { useFormContext } from "react-hook-form";
import { QuoteFormData } from "@/schema/quote";
import { useQuoteCalculator } from "@/hooks/useQuoteCalculator";
import { DEFAULT_DOORS_TIME, DEFAULT_START_TIME } from "@/lib/quoteDefaults";
import { fmt } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  InfoIcon,
  Receipt,
  ShieldCheck,
  Lightbulb,
  User,
  Building2,
  MapPin,
  Phone,
  Users,
  Mail,
  MessageSquareHeart,
  Calendar,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function StepFiveDetails({ onRedirect }: { onRedirect: () => void }) {
  const { items, subtotal, shouldRedirect } = useQuoteCalculator();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useFormContext<QuoteFormData>();

  const formData = watch();

  // ── 12 PM default: if times are blank/empty, fill in the default ─────────
  // This ensures the PDF workplan always has something useful even when the
  // user doesn't know exact times yet.
  const effectiveStartTime = formData.startTime?.trim() || DEFAULT_START_TIME;
  const effectiveDoorsTime = formData.doorsTime?.trim() || DEFAULT_DOORS_TIME;

  const showMicUpNote =
    formData.videoTypes?.includes("podcast") ||
    formData.videoTypes?.includes("web-video");

  if (shouldRedirect) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <Alert
          variant="destructive"
          className="bg-destructive/5 border-destructive/20 p-8 rounded-sm border-2"
        >
          <InfoIcon className="h-6 w-6" />
          <AlertTitle className="text-xl font-bold mb-2">
            Custom Consultation Required
          </AlertTitle>
          <AlertDescription className="text-sm opacity-90 leading-relaxed">
            Your project parameters fall outside our automated estimator. A
            Producer needs to review this manually.
          </AlertDescription>
        </Alert>
        <button
          onClick={onRedirect}
          className="w-full py-5 bg-primary text-primary-foreground font-bold rounded-full hover:scale-[1.02] transition-all uppercase tracking-widest text-xs"
        >
          Talk to a Producer →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 pb-12">
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 0: TIME & PLACE
          Moved here from StepTwo so users aren't asked about logistics
          before they've configured their services.
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-6">
        <div className="pb-6">
          <h2 className="text-3xl font-black tracking-tighter uppercase">
            Time & Place
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold mt-1">
            Event Logistics
          </p>
        </div>

        {/* ── LIVE EVENT fields ─────────────────────────────────────────── */}
        {formData.eventType === "live" && (
          <div className="space-y-6 p-8 border-2 border-primary/20 rounded-sm bg-primary/5">
            {/* Date */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] text-primary">
                <Calendar className="w-4 h-4" /> Event Date
              </Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setValue("hasDate", true)}
                  className={cn(
                    "flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all",
                    formData.hasDate
                      ? "border-primary bg-background text-primary"
                      : "border-border bg-background/50 text-muted-foreground",
                  )}
                >
                  I have a date
                </button>
                <button
                  type="button"
                  onClick={() => setValue("hasDate", false)}
                  className={cn(
                    "flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all",
                    !formData.hasDate
                      ? "border-primary bg-background text-primary"
                      : "border-border bg-background/50 text-muted-foreground",
                  )}
                >
                  TBD
                </button>
              </div>
              {formData.hasDate && (
                <Input
                  type="date"
                  {...register("eventDate")}
                  className="max-w-xs bg-background rounded-sm border-2 focus:ring-0"
                />
              )}
            </div>

            {/* Multi-day */}
            <div
              className="flex items-center space-x-3 p-5 bg-background border-2 rounded-sm cursor-pointer select-none"
              onClick={() => setValue("isMultiDay", !formData.isMultiDay)}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center",
                  formData.isMultiDay
                    ? "bg-primary border-primary"
                    : "border-border",
                )}
              >
                {formData.isMultiDay && (
                  <div className="w-2 h-2 bg-white rounded-sm" />
                )}
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm">
                  Multiple or Additional Days?
                </span>
                <p className="text-[10px] text-destructive font-bold mt-0.5">
                  → Redirects to Sales
                </p>
              </div>
            </div>

            {/* Venue count */}
            <div className="space-y-3">
              <Label className="font-black uppercase tracking-widest text-[10px] text-primary">
                One venue or multiple?
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { value: "single", label: "Single Venue" },
                    { value: "multiple", label: "Multiple Venues →Sales" },
                    { value: "tbd", label: "TBD" },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue("venueType", value)}
                    className={cn(
                      "p-3 rounded-sm border-2 font-bold text-xs uppercase transition-all",
                      formData.venueType === value
                        ? "border-primary bg-background text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Showtime logic */}
            <div className="space-y-3">
              <Label className="font-black uppercase tracking-widest text-[10px] text-primary">
                Do you know your showtimes?
              </Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setValue("hasShowTimes", true)}
                  className={cn(
                    "flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all",
                    formData.hasShowTimes
                      ? "border-primary bg-background text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue("hasShowTimes", false);
                    setValue("startTime", "");
                    setValue("doorsTime", "");
                    setValue("endTime", "");
                    setValue("hasDifferentDoorsTime", false);
                    setValue("hasEndTime", false);
                  }}
                  className={cn(
                    "flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all",
                    !formData.hasShowTimes
                      ? "border-primary bg-background text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  No
                </button>
              </div>
              {!formData.hasShowTimes && (
                <p className="text-[10px] text-muted-foreground">
                  We'll assume a 12:00 PM show start for workplan timing.
                </p>
              )}
              {formData.hasShowTimes && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      Show Start Time
                    </Label>
                    <Input
                      type="time"
                      {...register("startTime")}
                      placeholder={DEFAULT_START_TIME}
                      className="bg-background h-12 rounded-sm border-2"
                    />
                    <p className="text-[9px] text-muted-foreground">
                      Defaults to 12:00 PM if blank
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground">
                      Different doors time?
                    </Label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setValue("hasDifferentDoorsTime", true)}
                        className={cn(
                          "flex-1 p-2.5 rounded-sm border-2 font-bold text-xs transition-all",
                          formData.hasDifferentDoorsTime
                            ? "border-primary bg-background text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setValue("hasDifferentDoorsTime", false);
                          setValue("doorsTime", "");
                        }}
                        className={cn(
                          "flex-1 p-2.5 rounded-sm border-2 font-bold text-xs transition-all",
                          !formData.hasDifferentDoorsTime
                            ? "border-primary bg-background text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        No
                      </button>
                    </div>
                    {formData.hasDifferentDoorsTime && (
                      <Input
                        type="time"
                        {...register("doorsTime")}
                        placeholder={DEFAULT_DOORS_TIME}
                        className="bg-background h-12 rounded-sm border-2 mt-2"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground">
                      End time?
                    </Label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setValue("hasEndTime", true)}
                        className={cn(
                          "flex-1 p-2.5 rounded-sm border-2 font-bold text-xs transition-all",
                          formData.hasEndTime
                            ? "border-primary bg-background text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setValue("hasEndTime", false);
                          setValue("endTime", "");
                        }}
                        className={cn(
                          "flex-1 p-2.5 rounded-sm border-2 font-bold text-xs transition-all",
                          !formData.hasEndTime
                            ? "border-primary bg-background text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        No
                      </button>
                    </div>
                    {formData.hasEndTime && (
                      <Input
                        type="time"
                        {...register("endTime")}
                        className="bg-background h-12 rounded-sm border-2 mt-2"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground">
                      Mingling / cocktail hour?
                    </Label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setValue("hasMinglingCocktailHour", true)
                        }
                        className={cn(
                          "flex-1 p-2.5 rounded-sm border-2 font-bold text-xs transition-all",
                          formData.hasMinglingCocktailHour
                            ? "border-primary bg-background text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setValue("hasMinglingCocktailHour", false)
                        }
                        className={cn(
                          "flex-1 p-2.5 rounded-sm border-2 font-bold text-xs transition-all",
                          !formData.hasMinglingCocktailHour
                            ? "border-primary bg-background text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        No
                      </button>
                    </div>
                    {formData.hasMinglingCocktailHour && (
                      <div className="flex items-center gap-3 mt-2">
                        <Input
                          type="number"
                          {...register("cocktailDurationHours")}
                          className="max-w-25 bg-background rounded-sm border-2"
                        />
                        <span className="text-sm text-muted-foreground font-medium">
                          hours
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Duration — hidden when an explicit end time is provided,
                since duration is derivable from start + end and showing
                both fields is redundant (client feedback). */}
            {!(
              formData.hasShowTimes &&
              formData.hasEndTime &&
              formData.endTime?.trim()
            ) && (
              <div className="space-y-3">
                <Label className="font-black uppercase tracking-widest text-[10px] text-primary">
                  Do you know approximate hours?
                </Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("hasDuration", true)}
                    className={cn(
                      "flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all",
                      formData.hasDuration
                        ? "border-primary bg-background text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("hasDuration", false)}
                    className={cn(
                      "flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all",
                      !formData.hasDuration
                        ? "border-primary bg-background text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    TBD — use 4hr default
                  </button>
                </div>
                {formData.hasDuration && (
                  <div className="flex items-center gap-3 mt-2">
                    <Input
                      type="number"
                      {...register("durationHours")}
                      className="max-w-25 bg-background rounded-sm border-2"
                    />
                    <span className="text-sm text-muted-foreground font-medium">
                      hours
                    </span>
                  </div>
                )}
              </div>
            )}
            {/* When end time IS known, show a derived duration hint instead */}
            {formData.hasShowTimes &&
              formData.hasEndTime &&
              formData.endTime?.trim() &&
              formData.startTime?.trim() && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                    Duration derived from your times
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Your work plan timing will be calculated from your start and
                    end times.
                  </p>
                </div>
              )}
          </div>
        )}

        {/* ── STUDIO RECORDING fields ───────────────────────────────────── */}
        {formData.eventType === "studio" && (
          <div className="space-y-6 p-8 border-2 border-primary/20 rounded-sm bg-primary/5">
            {/* Date */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] text-primary">
                <Calendar className="w-4 h-4" /> Date in mind, or TBD?
              </Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setValue("hasDate", true)}
                  className={cn(
                    "flex-1 p-4 rounded-sm border-2 font-bold transition-all text-sm",
                    formData.hasDate
                      ? "border-primary bg-background text-primary"
                      : "border-border bg-background/50 text-muted-foreground",
                  )}
                >
                  Yes, I have a date
                </button>
                <button
                  type="button"
                  onClick={() => setValue("hasDate", false)}
                  className={cn(
                    "flex-1 p-4 rounded-sm border-2 font-bold transition-all text-sm",
                    !formData.hasDate
                      ? "border-primary bg-background text-primary"
                      : "border-border bg-background/50 text-muted-foreground",
                  )}
                >
                  TBD
                </button>
              </div>
              {formData.hasDate && (
                <Input
                  type="date"
                  {...register("eventDate")}
                  className="max-w-xs bg-background rounded-sm border-2 focus:ring-0"
                />
              )}
            </div>

            {/* Studio duration */}
            <div className="space-y-3">
              <Label className="font-black uppercase tracking-widest text-[10px] text-primary">
                Recording duration in mind, or TBD?
              </Label>
              <p className="text-[10px] text-muted-foreground">
                If TBD, we'll suggest an ideal workplan based on your
                deliverables.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setValue("studioHasDuration", true)}
                  className={cn(
                    "flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all",
                    formData.studioHasDuration
                      ? "border-primary bg-background text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setValue("studioHasDuration", false)}
                  className={cn(
                    "flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all",
                    !formData.studioHasDuration
                      ? "border-primary bg-background text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  TBD
                </button>
              </div>
              {formData.studioHasDuration && (
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    type="number"
                    step="0.5"
                    {...register("studioDurationHours")}
                    className="max-w-25 bg-background rounded-sm border-2"
                  />
                  <span className="text-sm text-muted-foreground font-medium">
                    hours
                  </span>
                </div>
              )}
            </div>

            {/* Studio location type */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 font-black uppercase tracking-widest text-[10px] text-primary">
                <MapPin className="w-4 h-4" /> Record at your location, or rent
                studio space?
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("studioLocationType", "office")}
                  className={cn(
                    "p-4 rounded-sm border-2 font-bold text-xs uppercase transition-all text-left",
                    formData.studioLocationType === "office"
                      ? "border-primary bg-background text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <div>Your Office / Hotel / Location</div>
                  <div className="font-normal normal-case text-[10px] mt-1 opacity-70">
                    We come to you
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setValue("studioLocationType", "studio-rental")
                  }
                  className={cn(
                    "p-4 rounded-sm border-2 font-bold text-xs uppercase transition-all text-left",
                    formData.studioLocationType === "studio-rental"
                      ? "border-destructive bg-destructive/5 text-destructive"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <div>Rent Studio Space</div>
                  <div className="font-normal normal-case text-[10px] mt-1 opacity-70">
                    → Redirects to Sales
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: IT'S ALL ABOUT YOU (unchanged from original)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-6 pt-10 border-double">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter uppercase">
              It's All About You
            </h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">
              Final Event & Contact Details
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue("isSpecQuote", false)}
                className={`p-4 rounded-sm border-2 text-left transition-all space-y-1 ${!formData.isSpecQuote ? "border-primary bg-primary/5" : "border-border bg-background"}`}
              >
                <p
                  className={`text-sm font-black uppercase tracking-tight ${!formData.isSpecQuote ? "text-primary" : "text-muted-foreground"}`}
                >
                  Real Sale
                </p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Quote goes to our sales team for approval & booking.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setValue("isSpecQuote", true)}
                className={`p-4 rounded-sm border-2 text-left transition-all space-y-1 ${formData.isSpecQuote ? "border-primary bg-primary/5" : "border-border bg-background"}`}
              >
                <p
                  className={`text-sm font-black uppercase tracking-tight ${formData.isSpecQuote ? "text-primary" : "text-muted-foreground"}`}
                >
                  Spec Quote
                </p>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Estimate only — sent to your email, not to sales.
                </p>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-primary">
                Event Name
              </Label>
              <Input
                {...register("eventName")}
                placeholder="Name of your event..."
                className="rounded-sm bg-background border-2"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-primary">
                Venue Name & Info
              </Label>
              <div className="flex items-center gap-3 p-3 bg-background border-2 rounded-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <Input
                  {...register("venueName")}
                  placeholder="Where is it happening?"
                  className="border-none p-0 focus-visible:ring-0 h-auto"
                />
              </div>
            </div>
          </div>

          <div className="transition-all duration-500">
            {formData.isSpecQuote ? (
              <div className="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-sm bg-muted/5 text-center">
                <ShieldCheck className="w-8 h-8 text-muted-foreground mb-2 opacity-20" />
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Spec Quote Mode
                </p>
                <p className="text-[9px] text-muted-foreground italic">
                  Contact info skipped for estimation
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-background border-2 rounded-sm">
                    <User className="w-4 h-4 text-primary" />
                    <Input
                      {...register("clientName")}
                      placeholder="Full Name"
                      className="border-none p-0 focus-visible:ring-0 h-auto text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background border-2 rounded-sm">
                    <Phone className="w-4 h-4 text-primary" />
                    <Input
                      {...register("clientPhone")}
                      placeholder="Phone Number"
                      className="border-none p-0 focus-visible:ring-0 h-auto text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background border-2 rounded-sm">
                    <Building2 className="w-4 h-4 text-primary" />
                    <Input
                      {...register("organization")}
                      placeholder="Organization / Company"
                      className="border-none p-0 focus-visible:ring-0 h-auto text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {!formData.isSpecQuote && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="poc"
                checked={formData.hasAdditionalPOC}
                onCheckedChange={(c) => setValue("hasAdditionalPOC", !!c)}
              />
              <Label
                htmlFor="poc"
                className="text-xs font-bold cursor-pointer flex items-center gap-2"
              >
                <Users className="w-4 h-4" /> Add additional points of contact?
              </Label>
            </div>
            {formData.hasAdditionalPOC && (
              <Input
                {...register("additionalPOC")}
                placeholder="Name and Email of additional POC"
                className="rounded-sm animate-in slide-in-from-top-2"
              />
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: QUOTE BREAKDOWN (unchanged)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-6 pt-10 border-double">
        <div className="flex items-center gap-3">
          <Receipt className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg uppercase tracking-widest">
            Quote Summary
          </h3>
        </div>

        <div className="rounded-sm border border-border/50 overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="font-bold py-4 pl-6">
                  Service Detail
                </TableHead>
                <TableHead className="text-right font-bold py-4">Qty</TableHead>
                <TableHead className="text-right font-bold py-4 pr-6">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx} className="border-border/40">
                  <TableCell className="py-5 pl-6">
                    <p className="font-bold text-sm leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                      {item.description}
                    </p>
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium text-muted-foreground">
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell className="text-right font-bold py-5 pr-6">
                    {fmt(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: TOTAL (unchanged)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex justify-between items-center p-8 bg-primary text-primary-foreground rounded-sm shadow-2xl shadow-primary/20">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">
            Estimated Investment
          </p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 opacity-70" />
            <p className="text-[10px] font-medium opacity-70 italic">
              Pending review
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-5xl font-black tracking-tighter">
            {fmt(subtotal)}
          </p>
          <p className="text-[10px] uppercase font-bold opacity-60">
            Estimate Only
          </p>
        </div>
      </div>

      {showMicUpNote && (
        <Alert className="bg-orange-50 border-orange-200 rounded-sm border-2 py-6">
          <Lightbulb className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-800 font-bold uppercase tracking-wider text-xs">
            Production Note
          </AlertTitle>
          <AlertDescription className="text-orange-700 text-sm">
            Please ensure all <strong>guests arrive 15 minutes early</strong> to
            be properly mic'd up.
          </AlertDescription>
        </Alert>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4: DELIVERY & FEEDBACK (unchanged)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-8 pt-10 border-t-2 border-primary/20">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black tracking-tight uppercase italic text-primary">
            Ready to Send?
          </h3>
          <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
            Email your custom estimate for {fmt(subtotal)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary">
                Enter Your Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  {...register("deliveryEmail")}
                  type="email"
                  placeholder="you@example.com"
                  onBlur={() => trigger("deliveryEmail")}
                  className={`pl-11 h-12 rounded-sm border-2 focus:border-primary transition-colors ${
                    errors.deliveryEmail
                      ? "border-destructive focus:border-destructive"
                      : "border-primary/10"
                  }`}
                />
              </div>
              {errors.deliveryEmail && (
                <p className="text-xs text-destructive font-medium">
                  {errors.deliveryEmail.message}
                </p>
              )}
            </div>

            <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-sm border-2 border-transparent hover:border-primary/10 transition-all cursor-pointer">
              <Checkbox
                id="newsletter"
                checked={formData.newsletterConsent}
                onCheckedChange={(c) => setValue("newsletterConsent", !!c)}
              />
              <Label
                htmlFor="newsletter"
                className="text-xs leading-tight cursor-pointer font-medium opacity-80"
              >
                Keep me updated with newsletters on production tips and gear.
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-70">
              <MessageSquareHeart className="w-4 h-4 text-primary" />
              How can we improve this tool?
            </Label>
            <Textarea
              {...register("feedback")}
              placeholder="Your feedback helps us grow..."
              className="min-h-28.75 rounded-sm bg-muted/20 border-2 border-transparent focus:border-primary/20 transition-all text-sm italic"
            />
          </div>
        </div>
      </div>

      <p className="text-center text-[14px] text-muted-foreground px-12 italic leading-relaxed">
        This is an automated estimate generated by The Recording Service.
      </p>
    </div>
  );
}

export const StepFourSummary = StepFiveDetails;
