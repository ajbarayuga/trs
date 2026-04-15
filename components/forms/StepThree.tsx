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
  AlertCircle,
  Camera,
  Layout,
  Settings,
  Mic2,
  Film,
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
  const videoTypes = formData.videoTypes ?? [];
  const mainServiceMissing = Boolean(errors.services);

  const toggleArray = useCallback(
    (field: "services" | "videoTypes", value: string) => {
      const current = (getValues(field) as string[]) ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setValue(field, updated as any, { shouldDirty: true });
    },
    [getValues, setValue],
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
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
              "cursor-pointer rounded-sm border-2 transition-all",
              services.includes("streaming")
                ? "border-primary bg-primary/5"
                : mainServiceMissing
                  ? "border-destructive bg-destructive/5 ring-2 ring-destructive"
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
              {/* Zoom-only shortcut */}
              <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-sm border border-primary/10">
                <Checkbox
                  id="zoom"
                  checked={formData.isZoomOnly ?? false}
                  onCheckedChange={(c) => setValue("isZoomOnly", !!c)}
                />
                <Label htmlFor="zoom" className="text-sm font-medium">
                  Using all built-in AV to stream to Zoom only? (Skips questions
                  below)
                </Label>
              </div>

              {!formData.isZoomOnly && (
                <div className="space-y-8">
                  {/* Camera count */}
                  <div className="space-y-4">
                    <Label className="flex items-center gap-2 font-bold">
                      <Camera className="w-4 h-4 text-primary" /> How many
                      cameras?
                    </Label>
                    <RadioGroup
                      value={formData.cameraCount}
                      onValueChange={(v) => {
                        setValue("cameraCount", v);
                        if (v.includes("call sales")) onRedirect();
                      }}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          "1",
                          "2",
                          "2+ (call sales)",
                          "not sure (call sales)",
                        ].map((opt) => (
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

                  {/* Manned vs. unmanned camera — only relevant when 2 cameras selected */}
                  {formData.cameraCount === "2" && (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border">
                      <Label className="flex items-center gap-2 font-bold text-sm">
                        <Users className="w-4 h-4 text-primary" /> Will both
                        cameras need a dedicated operator?
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        An unmanned camera is set up by your streaming tech but
                        runs on its own during the show — no operator needed.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div
                          className={`flex items-center gap-3 p-3 border rounded-sm cursor-pointer transition-all ${!formData.hasUnmannedCameras ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                          onClick={() => setValue("hasUnmannedCameras", false)}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 shrink-0 ${!formData.hasUnmannedCameras ? "border-primary bg-primary" : "border-muted-foreground"}`}
                          />
                          <div>
                            <p className="text-sm font-medium">
                              Yes, both are manned
                            </p>
                            <p className="text-xs text-muted-foreground">
                              2 camera operators billed
                            </p>
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-3 p-3 border rounded-sm cursor-pointer transition-all ${formData.hasUnmannedCameras ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                          onClick={() => setValue("hasUnmannedCameras", true)}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 shrink-0 ${formData.hasUnmannedCameras ? "border-primary bg-primary" : "border-muted-foreground"}`}
                          />
                          <div>
                            <p className="text-sm font-medium">
                              1 camera is unmanned
                            </p>
                            <p className="text-xs text-muted-foreground">
                              1 operator billed (saves cost)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Built-in camera source */}
                  {formData.builtInAV?.includes("cameras") && (
                    <div className="space-y-4 p-4 border-2 border-orange-200 bg-orange-50/30 rounded-2xl">
                      <Label className="font-bold text-orange-700">
                        Venue has Built-in Cameras
                      </Label>
                      <RadioGroup
                        value={formData.cameraSource}
                        onValueChange={(v: any) => setValue("cameraSource", v)}
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex items-center space-x-2 bg-background p-3 rounded-sm border">
                            <RadioGroupItem value="built-in" id="b1" />
                            <Label htmlFor="b1">
                              Use built-in (No cam kits needed)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 bg-background p-3 rounded-sm border">
                            <RadioGroupItem value="bring" id="b2" />
                            <Label htmlFor="b2">Bring in cameras</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Graphics & DIY */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-4 bg-background border rounded-sm">
                      <Checkbox
                        id="gr"
                        checked={formData.streamGraphics ?? false}
                        onCheckedChange={(c) => setValue("streamGraphics", !!c)}
                      />
                      <Label htmlFor="gr" className="text-sm font-medium">
                        On-screen graphics? (Adds prep)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-background border rounded-sm">
                      <Checkbox
                        id="diy"
                        checked={formData.diyStream ?? false}
                        onCheckedChange={(c) => setValue("diyStream", !!c)}
                      />
                      <Label htmlFor="diy" className="text-sm font-medium">
                        DIY your stream link? (Saves setup fee)
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Video Production card ──────────────────────────────────────── */}
        <div className="space-y-4">
          <Card
            className={cn(
              "cursor-pointer rounded-sm border-2 transition-all",
              services.includes("video")
                ? "border-primary bg-primary/5"
                : mainServiceMissing
                  ? "border-destructive bg-destructive/5 ring-2 ring-destructive"
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
            <div className="p-6 border-2 border-primary/20 rounded-sm bg-background space-y-6">
              <Label className="font-bold text-lg block border-b pb-2">
                Which type of video(s) are you interested in?
              </Label>
              <p className="text-[10px] text-muted-foreground -mt-2">
                If you just want filming with no editing, there will be an
                option for that later. This selection tells us what kind of
                material to film.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Studio-only options */}
                {formData.eventType === "studio" && (
                  <>
                    <div
                      className="flex items-center space-x-3 p-4 border rounded-sm cursor-pointer"
                      onClick={() => toggleArray("videoTypes", "podcast")}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={videoTypes.includes("podcast")}
                          onCheckedChange={() =>
                            toggleArray("videoTypes", "podcast")
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="font-bold block cursor-pointer">
                          Video Podcast
                        </Label>
                        <span className="text-[10px] text-muted-foreground">
                          2x mirrorless kit + lighting tech
                        </span>
                      </div>
                    </div>
                    <div
                      className="flex items-center space-x-3 p-4 border rounded-sm cursor-pointer"
                      onClick={() => toggleArray("videoTypes", "web-video")}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={videoTypes.includes("web-video")}
                          onCheckedChange={() =>
                            toggleArray("videoTypes", "web-video")
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="font-bold block cursor-pointer">
                          Web Video
                        </Label>
                        <span className="text-[10px] text-muted-foreground">
                          Custom duration content
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Live-only options */}
                {formData.eventType === "live" && (
                  <>
                    <div
                      className="flex items-center space-x-3 p-4 border rounded-sm cursor-pointer"
                      onClick={() => toggleArray("videoTypes", "highlight")}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={videoTypes.includes("highlight")}
                          onCheckedChange={() =>
                            toggleArray("videoTypes", "highlight")
                          }
                        />
                      </div>
                      <Label className="font-bold cursor-pointer">
                        Event Highlight
                      </Label>
                    </div>
                    <div
                      className="flex items-center space-x-3 p-4 border rounded-sm cursor-pointer"
                      onClick={() => toggleArray("videoTypes", "lecture")}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={videoTypes.includes("lecture")}
                          onCheckedChange={() =>
                            toggleArray("videoTypes", "lecture")
                          }
                        />
                      </div>
                      <Label className="font-bold cursor-pointer">
                        Lecture or Panel Discussion
                      </Label>
                    </div>
                  </>
                )}
              </div>

              {/* ── Highlight sub-questions ── */}
              {videoTypes.includes("highlight") && (
                <div className="p-6 bg-primary/5 rounded-2xl border-2 border-primary/10 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-primary">
                    <Video className="w-4 h-4" /> Event Highlight Details
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Under 4 hours = half day rate. 4 hours or more = full day
                    rate.
                  </p>
                  <div className="space-y-2">
                    <Label className="text-xs">
                      How many hours will we be filming?
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0.5}
                        max={24}
                        step={0.5}
                        {...register("highlightDurationHours")}
                        className="bg-background max-w-30"
                      />
                      <span className="text-sm text-muted-foreground">
                        hours
                      </span>
                      <span className="text-[10px] text-primary font-bold">
                        {(formData.highlightDurationHours ?? 4) < 4
                          ? "→ Half Day Rate"
                          : "→ Full Day Rate"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Podcast sub-questions ── */}
              {videoTypes.includes("podcast") && (
                <div className="p-6 bg-primary/5 rounded-2xl border-2 border-primary/10 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-primary">
                    <Mic2 className="w-4 h-4" /> Podcast Details
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Guests should arrive at least 15 min before filming to get
                    mic'd up.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Number of Episodes</Label>
                      <Input
                        type="number"
                        min={1}
                        {...register("podcastEpisodes")}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">
                        Recording Duration (hrs)
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        {...register("podcastDuration")}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Web Video sub-questions ── */}
              {videoTypes.includes("web-video") && (
                <div className="p-6 bg-primary/5 rounded-2xl border-2 border-primary/10 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-primary">
                    <Film className="w-4 h-4" /> Web Video Details
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Guests should arrive at least 15 min before filming to get
                    mic'd up. Max 12 videos per day. Videos over 3 min → Call
                    Sales.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">People to Film</Label>
                      <Input
                        type="number"
                        min={1}
                        {...register("webVideoPeople")}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Number of Videos</Label>
                      <Input
                        type="number"
                        min={1}
                        {...register("webVideoCount")}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Length per Video (min)</Label>
                      <Input
                        type="number"
                        {...register("webVideoDuration")}
                        className="bg-background"
                        placeholder="e.g. 2"
                        onBlur={(e) => {
                          if (parseFloat(e.target.value) > 3) onRedirect();
                        }}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Max 3 min. e.g. enter 2 for a 2-minute video.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Lecture sub-questions ── */}
              {videoTypes.includes("lecture") && (
                <div className="p-6 bg-primary/5 rounded-2xl border-2 border-primary/10 space-y-6">
                  <div className="flex items-center gap-2 font-bold text-primary">
                    <Layout className="w-4 h-4" /> Lecture / Panel Details
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                          {[
                            "up to 1hr",
                            "up to 2hr",
                            "up to 3hr",
                            "longer (call sales)",
                          ].map((t) => (
                            <div
                              key={t}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem value={t} id={t} />
                              <Label htmlFor={t} className="text-[10px]">
                                {t}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  {/* PPT slides */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ppt"
                      checked={formData.lecturePPT ?? false}
                      onCheckedChange={(c) => setValue("lecturePPT", !!c)}
                    />
                    <Label htmlFor="ppt" className="text-sm">
                      Does it have PPT slides?
                    </Label>
                  </div>

                  {/* Reuse stream material */}
                  {services.includes("streaming") && (
                    <div className="flex items-center space-x-2 p-3 bg-background border rounded-sm">
                      <Checkbox
                        id="fromStream"
                        checked={formData.lectureFromStream ?? false}
                        onCheckedChange={(c) =>
                          setValue("lectureFromStream", !!c)
                        }
                      />
                      <Label htmlFor="fromStream" className="text-sm">
                        Are these video deliverables cuts of the same material
                        you'd like us to live stream?
                      </Label>
                    </div>
                  )}

                  {/* Additional camera angles */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="angles"
                        checked={formData.additionalAngles ?? false}
                        onCheckedChange={(c) =>
                          setValue("additionalAngles", !!c)
                        }
                      />
                      <Label htmlFor="angles" className="text-sm">
                        Would you like additional camera angles?
                      </Label>
                    </div>
                    {formData.additionalAngles && (
                      <div className="flex items-center gap-3 pl-6 animate-in slide-in-from-top-2">
                        <Input
                          type="number"
                          {...register("angleCount")}
                          className="max-w-25 bg-background rounded-sm border-2"
                        />
                        <span className="text-sm text-muted-foreground">
                          additional angle(s)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ SOCIAL SHORTS (always visible, outside the Services group) ═══════ */}
      <Card
        className={`border-2 rounded-sm transition-all ${formData.wantsSocialShorts ? "border-primary bg-primary/5" : "border-border"}`}
      >
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Users className="text-primary w-6 h-6" />
            <div
              className="flex-1 cursor-pointer"
              onClick={() =>
                setValue("wantsSocialShorts", !formData.wantsSocialShorts)
              }
            >
              <div className="font-bold text-lg">Social Shorts</div>
              <p className="text-xs text-muted-foreground">
                Optimized vertical clips for social media
              </p>
            </div>
            <Checkbox
              checked={formData.wantsSocialShorts ?? false}
              onCheckedChange={(c) => setValue("wantsSocialShorts", !!c)}
            />
          </div>

          {formData.wantsSocialShorts && (
            <div className="space-y-6 animate-in slide-in-from-top-4 p-4 border-t">
              <div className="space-y-2">
                <Label className="font-bold">
                  How many shorts would you like?
                </Label>
                <Input
                  type="number"
                  min={0}
                  {...register("socialShortsCount")}
                  className="bg-background max-w-37.5"
                />
              </div>
              <div className="space-y-3">
                <Label className="font-bold">Material Source</Label>
                <RadioGroup
                  value={formData.shortsSource}
                  onValueChange={(v: any) => setValue("shortsSource", v)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 p-3 bg-background border rounded-sm">
                      <RadioGroupItem value="filming" id="sh1" />
                      <Label htmlFor="sh1">
                        Filming additional material (Adds Mirrorless Kit)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-background border rounded-sm">
                      <RadioGroupItem value="recut" id="sh2" />
                      <Label htmlFor="sh2">
                        Recutting existing material / footage library
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══ CALL SALES redirects ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="border-2 rounded-sm border-dashed cursor-pointer opacity-70 hover:opacity-100"
          onClick={onRedirect}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="w-5 h-5" />
            <div className="flex-1 font-bold text-sm">
              Concert Video (Call Sales)
            </div>
          </CardContent>
        </Card>
        <Card
          className="border-2 rounded-sm border-dashed cursor-pointer opacity-70 hover:opacity-100"
          onClick={onRedirect}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <Settings className="w-5 h-5" />
            <div className="flex-1 font-bold text-sm">
              Video Editing Only (Call Sales)
            </div>
          </CardContent>
        </Card>
        <Card
          className="border-2 rounded-sm border-dashed cursor-pointer opacity-70 hover:opacity-100"
          onClick={onRedirect}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <Settings className="w-5 h-5" />
            <div className="flex-1 font-bold text-sm">Other (Call Sales)</div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-6 text-center text-muted-foreground space-y-1 font-medium">
        <p className="text-primary font-bold text-[14px] ">
          No live streaming or video capabilities require trucking
        </p>
        <p className="text-[14px] ">
          Customer must provide internet upload speed of at least 15 mb/s per
          platform
        </p>
      </div>
    </div>
  );
}
