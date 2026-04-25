"use client";

import { useFormContext } from "react-hook-form";
import { QuoteFormData } from "@/schema/quote";
import { useCallback } from "react";
import {
  Video,
  Home,
  HelpCircle,
  Camera,
  Volume2,
  Monitor,
  Tv,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export function VenueEquipmentCheck() {
  const { watch, setValue, getValues } = useFormContext<QuoteFormData>();
  const formData = watch();

  const toggleAV = useCallback(
    (id: string) => {
      const current = getValues("builtInAV") ?? [];
      if (id === "not-sure") {
        const next = current.includes("not-sure") ? [] : ["not-sure"];
        setValue("builtInAV", next, { shouldValidate: false, shouldDirty: true });
        return;
      }
      const withoutNotSure = current.filter((i: string) => i !== "not-sure");
      const next = withoutNotSure.includes(id)
        ? withoutNotSure.filter((i: string) => i !== id)
        : [...withoutNotSure, id];
      setValue("builtInAV", next, { shouldValidate: false, shouldDirty: true });
      // Keep cameraSource in sync: venue has built-in cameras → use them by default
      if (id === "cameras") {
        setValue("cameraSource", next.includes("cameras") ? "built-in" : "bring", { shouldDirty: true });
      }
    },
    [getValues, setValue],
  );

  const isNotSure = formData.builtInAV?.includes("not-sure") ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-black tracking-tight uppercase">
          Venue Equipment Check
        </h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
          Optional — helps us discount your quote
        </p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Does your venue/location have built-in AV we could leverage for
        better value? A Producer can do a free site visit to evaluate and
        discount your quote accordingly.
      </p>

      <div className="space-y-4">
        {[
          { id: "cameras", l: "Cameras / Video", note: "Removes camera kit from quote", icon: Camera },
          { id: "audio", l: "Sound System", note: "Removes sound kit & mics", icon: Volume2 },
          { id: "projector", l: "Projector & Screen", note: "Removes PJ & Screen line item", icon: Monitor },
          { id: "tvs", l: "TVs", note: "Removes TV line item", icon: Tv },
        ].map((item) => {
          const isChecked = formData.builtInAV?.includes(item.id) ?? false;
          return (
            <Card
              key={item.id}
              className={cn(
                "cursor-pointer rounded-sm border-2 transition-all py-0 gap-0",
                isNotSure
                  ? "opacity-40 pointer-events-none border-border"
                  : isChecked
                    ? "border-primary bg-primary/5"
                    : "border-border",
              )}
              onClick={() => !isNotSure && toggleAV(item.id)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <item.icon className="w-6 h-6 shrink-0 text-primary" />
                <div className="flex-1">
                  <div className="font-bold text-lg">{item.l}</div>
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => !isNotSure && toggleAV(item.id)}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Card
          className={cn(
            "cursor-pointer rounded-sm border-2 transition-all py-0 gap-0",
            isNotSure
              ? "border-amber-400 bg-amber-50/60"
              : "border-dashed border-border",
          )}
          onClick={() => toggleAV("not-sure")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <HelpCircle className={cn("w-6 h-6 shrink-0", isNotSure ? "text-amber-500" : "text-primary")} />
            <div className="flex-1">
              <div className={cn("font-bold text-lg", isNotSure ? "text-amber-700" : "")}>
                Not Sure — Send Someone to Check
              </div>
              <p className="text-xs text-muted-foreground">
                A Producer will schedule a free site visit to assess what your venue has and apply discounts.
              </p>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isNotSure}
                onCheckedChange={() => toggleAV("not-sure")}
                className={isNotSure ? "data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400" : ""}
              />
            </div>
          </CardContent>
        </Card>
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
  );
}

export function StepTwo({
  onRedirect: _onRedirect,
}: { onRedirect?: () => void } = {}) {
  const { watch, setValue } = useFormContext<QuoteFormData>();
  const formData = watch();

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
                    : "border-foreground/30",
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

    </div>
  );
}
