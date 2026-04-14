"use client";

import { useFormContext } from "react-hook-form";
import { QuoteFormData } from "@/schema/quote";
import { useCallback } from "react";
import {
  Monitor,
  Video,
  Home,
  HelpCircle,
  HelpCircle as NotSureIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function StepTwo({
  onRedirect: _onRedirect,
}: { onRedirect?: () => void } = {}) {
  const { watch, setValue, getValues } = useFormContext<QuoteFormData>();
  const formData = watch();

  // ── Stable toggleAV ──────────────────────────────────────────────────────
  // "not-sure" is stored the same as any other builtInAV value.
  // When it's checked, all other checkboxes are disabled — the user is saying
  // "I don't know what the venue has; please send someone to check."
  const toggleAV = useCallback(
    (id: string) => {
      const current = getValues("builtInAV") ?? [];

      // If selecting "not-sure", clear all others first
      if (id === "not-sure") {
        const next = current.includes("not-sure") ? [] : ["not-sure"];
        setValue("builtInAV", next, {
          shouldValidate: false,
          shouldDirty: true,
        });
        return;
      }

      // If selecting a real item, remove "not-sure" if it was set
      const withoutNotSure = current.filter((i: string) => i !== "not-sure");
      const next = withoutNotSure.includes(id)
        ? withoutNotSure.filter((i: string) => i !== id)
        : [...withoutNotSure, id];
      setValue("builtInAV", next, { shouldValidate: false, shouldDirty: true });
    },
    [getValues, setValue],
  );

  const isNotSure = formData.builtInAV?.includes("not-sure") ?? false;

  const categories = [
    { id: "live", label: "Live Event", icon: Video },
    { id: "studio", label: "Studio-Style Recording", icon: Home },
    { id: "other", label: "Other", icon: HelpCircle },
  ] as const;

  return (
    <div className="space-y-12 pb-10">
      {/* ── Event Type ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-4">
          What kind of event is this?
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={cn(
                "cursor-pointer border-2 transition-all duration-300 rounded-sm min-h-35 flex flex-col items-center justify-center text-center p-6",
                formData.eventType === cat.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/20 bg-card",
              )}
              onClick={() => setValue("eventType", cat.id as any)}
            >
              <cat.icon
                className={cn(
                  "w-6 h-6 mb-3",
                  formData.eventType === cat.id
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              />
              <span className="font-bold uppercase tracking-tight text-[11px] leading-tight select-none">
                {cat.label}
              </span>
              <div
                className={cn(
                  "w-4 h-4 mt-3 rounded-full border-2 flex items-center justify-center",
                  formData.eventType === cat.id
                    ? "border-primary"
                    : "border-muted",
                )}
              >
                {formData.eventType === cat.id && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Venue Equipment Check ────────────────────────────────────────── */}
      <div className="p-8 border-2 border-primary/20 rounded-sm bg-primary/5 space-y-6">
        <div className="space-y-1">
          <h3 className="font-black uppercase text-base text-primary flex items-center gap-2 mb-4">
            <Monitor className="w-4 h-4" /> Venue Equipment Check
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Does your venue/location have built-in AV we could leverage for
            better value? A Producer can do a free site visit to evaluate and
            discount your quote accordingly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              id: "cameras",
              l: "Cameras / Video",
              note: "Removes camera kit from quote",
            },
            {
              id: "audio",
              l: "Sound System",
              note: "Removes sound kit & mics",
            },
            {
              id: "projector",
              l: "Projector & Screen",
              note: "Removes PJ & Screen line item",
            },
            { id: "tvs", l: "TVs", note: "Removes TV line item" },
          ].map((item) => {
            const isChecked = formData.builtInAV?.includes(item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start space-x-3 p-4 bg-background border-2 rounded-sm cursor-pointer transition-all select-none",
                  isNotSure
                    ? "opacity-40 pointer-events-none border-border"
                    : isChecked
                      ? "border-primary ring-1 ring-primary/10 shadow-sm"
                      : "border-border hover:border-primary/20",
                )}
                onClick={() => !isNotSure && toggleAV(item.id)}
              >
                <div
                  className={cn(
                    "w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0",
                    isChecked ? "bg-primary border-primary" : "border-muted",
                  )}
                >
                  {isChecked && <div className="w-2 h-2 bg-white rounded-sm" />}
                </div>
                <div>
                  <span className="font-bold text-xs uppercase tracking-tight block">
                    {item.l}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {item.note}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Not Sure option ── */}
        {/* When selected, clears all other checks and flags quote for site visit */}
        <div
          className={cn(
            "flex items-start space-x-3 p-4 border-2 rounded-sm cursor-pointer transition-all select-none",
            isNotSure
              ? "border-amber-400 bg-amber-50/60 ring-1 ring-amber-200"
              : "border-dashed border-border hover:border-amber-300 bg-background",
          )}
          onClick={() => toggleAV("not-sure")}
        >
          <div
            className={cn(
              "w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0",
              isNotSure ? "bg-amber-400 border-amber-400" : "border-muted",
            )}
          >
            {isNotSure && <div className="w-2 h-2 bg-white rounded-sm" />}
          </div>
          <div>
            <span className="font-bold text-xs uppercase tracking-tight block text-amber-700">
              Not Sure — Send Someone to Check
            </span>
            <span className="text-[9px] text-muted-foreground">
              A Producer will schedule a free site visit to assess what your
              venue has and apply discounts accordingly.
            </span>
          </div>
        </div>

        {isNotSure && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-in slide-in-from-top-2">
            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
              ✓ We'll include a site visit in your quote. A Producer will reach
              out to coordinate timing before your event.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
