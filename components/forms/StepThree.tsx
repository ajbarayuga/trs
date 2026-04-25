"use client";

import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { QuoteFormData } from "@/schema/quote";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Video,
  Share2,
  Users,
  Camera,
  Layout,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── What changed ──────────────────────────────────────────────────────────────
// "Capabilities" (Live Streaming) and "Solutions" (Video Production) were
// previously two separate unnamed sections with a visual break between them.
// They are now presented under a single "Services" heading with a unified
// sub-label "Select all that apply" — matching the Audio-Visual step pattern.
// All sub-questions, redirect guards, and field logic are identical.
// ─────────────────────────────────────────────────────────────────────────────

export function StepThree({ onRedirect }: { onRedirect: () => void }) {
  const { register, setValue, watch, getValues, formState } =
    useFormContext<QuoteFormData>();
  const { errors } = formState;
  const formData = watch();
  const services = formData.services ?? [];
  const mainServiceMissing = Boolean(errors.services);

  const toggleArray = useCallback(
    (field: "services" | "videoTypes" | "videoBuiltInEditing" | "videoTRSEditing", value: string) => {
      const current = (getValues(field) as string[]) ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setValue(field, updated as any, { shouldDirty: true });
    },
    [getValues, setValue],
  );

  return (
    <div className="animate-in fade-in duration-500">
      {/* ══ SERVICES (merged Streaming + Video) ═════════════════════════════ */}
      <div className="space-y-6">
        {/* Section header — unified label matching Audio-Visual step pattern */}
        <div>
          <h3 className="text-xl font-black tracking-tight uppercase">
            Services
          </h3>
          <p
            className={cn(
              "text-[10px] uppercase tracking-widest mt-1",
              mainServiceMissing
                ? "text-destructive font-bold leading-snug"
                : "text-muted-foreground",
            )}
          >
            {mainServiceMissing
              ? "Pick Live Streaming and/or Video here, or Public Address on the next step."
              : "Select all that apply"}
          </p>
        </div>

        {/* ── Live Streaming card ────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card
            className={cn(
              "cursor-pointer rounded-sm border-2 transition-all py-0 gap-0",
              services.includes("streaming")
                ? "border-primary bg-primary/5"
                : mainServiceMissing
                  ? "border-field-error bg-destructive/5 ring-2 ring-field-error"
                  : "border-border",
            )}
            onClick={() => toggleArray("services", "streaming")}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <Share2
                className={cn(
                  "w-6 h-6 shrink-0",
                  services.includes("streaming")
                    ? "text-primary"
                    : mainServiceMissing
                      ? "text-destructive"
                      : "text-primary",
                )}
              />
              <div className="flex-1">
                <div className="font-bold text-lg">Live Streaming</div>
                <p className="text-xs text-muted-foreground">
                  Broadcast to Zoom, YouTube, or Social Media
                </p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={services.includes("streaming")}
                  onCheckedChange={() => toggleArray("services", "streaming")}
                />
              </div>
            </CardContent>
          </Card>

          {services.includes("streaming") && (
            <div className="p-6 border-2 border-primary/20 rounded-sm bg-background space-y-8 animate-in slide-in-from-top-4">
              <div className="space-y-8">
                  {formData.builtInAV?.includes("cameras") ? (
                    <div className="p-4 border border-green-200 bg-green-50/50 rounded-sm space-y-0.5">
                      <p className="text-xs font-bold text-green-700">
                        ✓ Camera kit removed — venue cameras will be used
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Go back to Step 1 to change this.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Camera count */}
                      <div className="space-y-4">
                        <Label className="flex items-center gap-2 font-bold">
                          <Camera className="w-4 h-4 text-primary" /> How many cameras?
                        </Label>
                        <RadioGroup
                          value={formData.cameraCount}
                          onValueChange={(v) => {
                            setValue("cameraCount", v);
                            if (v.includes("call sales")) onRedirect();
                          }}
                        >
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {["1", "2", "2+ (call sales)", "not sure (call sales)"].map((opt) => (
                              <div
                                key={opt}
                                className="flex items-center space-x-2 p-3 border rounded-sm bg-background"
                              >
                                <RadioGroupItem value={opt} id={`cam-${opt}`} />
                                <Label htmlFor={`cam-${opt}`} className="text-xs">
                                  {opt}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Manned vs. unmanned — only relevant when 2 cameras selected */}
                      {formData.cameraCount === "2" && (
                        <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border">
                          <Label className="flex items-center gap-2 font-bold text-sm">
                            <Users className="w-4 h-4 text-primary" /> Will both cameras need a dedicated operator?
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            An unmanned camera is set up by your streaming tech but runs on its own during the show — no operator needed.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div
                              className={`flex items-center gap-3 p-3 border rounded-sm cursor-pointer transition-all ${!formData.hasUnmannedCameras ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                              onClick={() => setValue("hasUnmannedCameras", false)}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${!formData.hasUnmannedCameras ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                              <div>
                                <p className="text-sm font-medium">Yes, both are manned</p>
                                <p className="text-xs text-muted-foreground">Both cameras have dedicated operators</p>
                              </div>
                            </div>
                            <div
                              className={`flex items-center gap-3 p-3 border rounded-sm cursor-pointer transition-all ${formData.hasUnmannedCameras ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                              onClick={() => setValue("hasUnmannedCameras", true)}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${formData.hasUnmannedCameras ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                              <div>
                                <p className="text-sm font-medium">1 camera is unmanned</p>
                                <p className="text-xs text-muted-foreground">Runs on its own — no dedicated operator</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
              </div>

              {/* Client doc: TRS-provided streaming options */}
              <div className="space-y-4 pt-2 border-t border-border/50">
                <Label className="font-bold text-sm">
                  I want The Recording Service to provide:
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-background border rounded-sm">
                    <Checkbox
                      id="streamLink"
                      checked={!(formData.diyStream ?? false)}
                      onCheckedChange={(c) =>
                        setValue("diyStream", c !== true, { shouldDirty: true })
                      }
                    />
                    <Label htmlFor="streamLink" className="text-sm font-medium">
                      Stream Link
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-background border rounded-sm">
                    <Checkbox
                      id="streamGraphics"
                      checked={formData.streamGraphics ?? false}
                      onCheckedChange={(c) => setValue("streamGraphics", !!c)}
                    />
                    <Label htmlFor="streamGraphics" className="text-sm font-medium">
                      On Screen Graphics
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Video Production card ──────────────────────────────────────── */}
        <div className="space-y-4">
          <Card
            className={cn(
              "cursor-pointer rounded-sm border-2 transition-all py-0 gap-0",
              services.includes("video")
                ? "border-primary bg-primary/5"
                : mainServiceMissing
                  ? "border-field-error bg-destructive/5 ring-2 ring-field-error"
                  : "border-border",
            )}
            onClick={() => toggleArray("services", "video")}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <Video
                className={cn(
                  "w-6 h-6 shrink-0",
                  services.includes("video")
                    ? "text-primary"
                    : mainServiceMissing
                      ? "text-destructive"
                      : "text-primary",
                )}
              />
              <div className="flex-1">
                <div className="font-bold text-lg">Video Production</div>
                <p className="text-xs text-muted-foreground">
                  Professional filming and post-event editing
                </p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={services.includes("video")}
                  onCheckedChange={() => toggleArray("services", "video")}
                />
              </div>
            </CardContent>
          </Card>

          {services.includes("video") && (
            <div className="p-6 border-2 border-primary/20 rounded-sm bg-background space-y-5 animate-in slide-in-from-top-4">
              {/* Lecture / Panel Details — always shown */}
              <div className="p-4 bg-primary/5 rounded-sm border border-primary/10 space-y-4">
                <div className="flex items-center gap-2 font-bold">
                  <Layout className="w-4 h-4 text-primary" />
                  <span>Lecture / Panel Details</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs">How many talks?</Label>
                    <Input
                      type="number"
                      min={1}
                      {...register("lectureTalksCount")}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Duration per talk?</Label>
                    <RadioGroup
                      value={formData.lectureTalkDuration}
                      onValueChange={(v: any) => {
                        setValue("lectureTalkDuration", v);
                        if (v === "longer (call sales)") onRedirect();
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        {["up to 1hr", "up to 2hr", "up to 3hr", "longer (call sales)"].map((t) => (
                          <div key={t} className="flex items-center space-x-2">
                            <RadioGroupItem value={t} id={`dur-${t}`} />
                            <Label htmlFor={`dur-${t}`} className="text-[10px]">{t}</Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ppt"
                    checked={formData.lecturePPT ?? false}
                    onCheckedChange={(c) => setValue("lecturePPT", !!c)}
                  />
                  <Label htmlFor="ppt" className="text-sm">Does it have PPT slides?</Label>
                </div>
              </div>

              {/* Accordion: built-in cameras */}
              <div className={cn("border-2 rounded-sm transition-all", formData.videoBuiltInEnabled ? "border-primary" : "border-border")}>
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer select-none"
                  onClick={() => setValue("videoBuiltInEnabled", !formData.videoBuiltInEnabled)}
                >
                  <div className={cn("w-2 h-2 rounded-full shrink-0 transition-colors", formData.videoBuiltInEnabled ? "bg-primary" : "bg-muted-foreground/40")} />
                  <span className="font-bold text-sm">Does the venue have built-in cameras, and would you like to use it?</span>
                </div>
                {formData.videoBuiltInEnabled && (
                  <div className="px-6 pb-5 pt-4 space-y-4 border-t animate-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Video Editing</Label>
                      <div className="space-y-3 pl-2">
                        {[
                          { id: "lecture", label: "Lecture or Panel Discussion" },
                          { id: "social-short", label: "Social Short" },
                        ].map((opt) => (
                          <div key={opt.id}>
                            <div
                              className="flex items-center space-x-2 cursor-pointer"
                              onClick={() => toggleArray("videoBuiltInEditing", opt.id)}
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={(formData.videoBuiltInEditing ?? []).includes(opt.id)}
                                  onCheckedChange={() =>
                                    toggleArray("videoBuiltInEditing", opt.id)
                                  }
                                />
                              </div>
                              <Label className="text-sm cursor-pointer">{opt.label}</Label>
                            </div>
                            {opt.id === "social-short" && (formData.videoBuiltInEditing ?? []).includes("social-short") && (
                              <div className="pl-6 mt-2 flex items-center gap-2 animate-in slide-in-from-top-1">
                                <Label className="text-xs whitespace-nowrap">How many social media short?</Label>
                                <Input type="number" min={0} {...register("videoBuiltInSocialShortsCount")} className="bg-background max-w-20" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion: TRS cameras */}
              <div className={cn("border-2 rounded-sm transition-all", formData.videoTRSEnabled ? "border-primary" : "border-border")}>
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer select-none"
                  onClick={() => setValue("videoTRSEnabled", !formData.videoTRSEnabled)}
                >
                  <div className={cn("w-2 h-2 rounded-full shrink-0 transition-colors", formData.videoTRSEnabled ? "bg-primary" : "bg-muted-foreground/40")} />
                  <span className="font-bold text-sm">Do you want The Recording Service to provide cameras?</span>
                </div>
                {formData.videoTRSEnabled && (
                  <div className="px-6 pb-5 pt-4 space-y-4 border-t animate-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label className="text-xs">No. of Camera Angles</Label>
                      <Input type="number" min={1} {...register("videoTRSCameraAngles")} className="bg-background max-w-25" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Video Editing</Label>
                      <div className="space-y-3 pl-2">
                        {[
                          { id: "lecture", label: "Lecture or Panel Discussion" },
                          { id: "highlight", label: "Event Highlight" },
                          { id: "social-short", label: "Social Short" },
                        ].map((opt) => (
                          <div key={opt.id}>
                            <div
                              className="flex items-center space-x-2 cursor-pointer"
                              onClick={() => toggleArray("videoTRSEditing", opt.id)}
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={(formData.videoTRSEditing ?? []).includes(opt.id)}
                                  onCheckedChange={() =>
                                    toggleArray("videoTRSEditing", opt.id)
                                  }
                                />
                              </div>
                              <Label className="text-sm cursor-pointer">{opt.label}</Label>
                            </div>
                            {opt.id === "social-short" && (formData.videoTRSEditing ?? []).includes("social-short") && (
                              <div className="pl-6 mt-2 flex items-center gap-2 animate-in slide-in-from-top-1">
                                <Label className="text-xs whitespace-nowrap">How many social media short?</Label>
                                <Input type="number" min={0} {...register("videoTRSSocialShortsCount")} className="bg-background max-w-20" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
