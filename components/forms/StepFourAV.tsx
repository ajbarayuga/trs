"use client";

import Image from "next/image";
import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { QuoteFormData } from "@/schema/quote";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  Volume2,
  Monitor,
  Lightbulb,
  Camera,
  AlertCircle,
  Users,
  Music,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MIC_TYPES = [
  {
    key: "micWirelessComboKits",
    label: "Wireless Combo Kit",
    desc: "1 receiver · 1 handheld · 1 lav — choose how you want to use it at the event",
    img: "/mics/wireless-handheld.avif",
  },
  {
    key: "micWiredMicKits",
    label: "Wired Mic Kit (SM58)",
    desc: "Industry-standard wired vocal mic",
    img: "/mics/wired-sm58.avif",
  },
  {
    key: "micGooseneckMics",
    label: "Gooseneck Mic",
    desc: "Podium / lectern mic",
    img: "/mics/wired-gooseneck.avif",
  },
] as const;

export function StepFourAV({ onRedirect }: { onRedirect: () => void }) {
  const { register, setValue, watch, getValues, formState } =
    useFormContext<QuoteFormData>();
  const { errors } = formState;
  const formData = watch();
  const audioServices = formData.audioServices ?? [];
  const mainServiceMissing = Boolean(errors.services);
  const lightingServices = formData.lightingServices ?? [];
  const photographyServices = formData.photographyServices ?? [];

  const toggleArray = useCallback(
    (
      field: "audioServices" | "lightingServices" | "photographyServices",
      value: string,
    ) => {
      const current = (getValues(field) as string[]) ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setValue(field, updated as any, { shouldDirty: true });
    },
    [getValues, setValue],
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-10">
      {/* ══ SERVICES CONTINUED: PUBLIC ADDRESS + MORE EVENT AV ═════════════ */}
      <div className="space-y-3">
          {/* Public Address */}
          <Card
            className={cn(
              "cursor-pointer rounded-sm border-2 transition-all py-0 gap-0",
              audioServices.includes("pa")
                ? "border-primary bg-primary/5"
                : mainServiceMissing
                  ? "border-field-error bg-destructive/5 ring-2 ring-field-error"
                  : "border-border",
            )}
            onClick={() => toggleArray("audioServices", "pa")}
          >
            <CardContent className="flex items-center gap-4 p-6 min-h-24">
              <Volume2
                className={cn(
                  "w-6 h-6 shrink-0",
                  audioServices.includes("pa")
                    ? "text-primary"
                    : mainServiceMissing
                      ? "text-destructive"
                      : "text-primary",
                )}
              />
              <div className="flex-1">
                <div className="font-bold text-lg">Public Address</div>
                <p className="text-xs text-muted-foreground">
                  Speakers, mics, and PA system for your event
                </p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={audioServices.includes("pa")}
                  onCheckedChange={() => toggleArray("audioServices", "pa")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quote Gen Map placeholders (disabled while logic is revised).
              Hide while Public Address is active so selected-tab content
              appears directly under the selected option. */}
          {!audioServices.includes("pa") && (
            <>
              <Card className="rounded-sm border-2 border-dashed border-border opacity-55 cursor-not-allowed py-0 gap-0">
                <CardContent className="flex items-center gap-4 p-6 min-h-24">
                  <AlertCircle className="w-5 h-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-bold text-lg">Video Editing Only</div>
                    <p className="text-xs text-muted-foreground">
                      Temporarily disabled while pricing and logic are being revised
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-sm border-2 border-dashed border-border opacity-55 cursor-not-allowed py-0 gap-0">
                <CardContent className="flex items-center gap-4 p-6 min-h-24">
                  <AlertCircle className="w-5 h-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-bold text-lg">More Event AV</div>
                    <p className="text-xs text-muted-foreground">
                      Temporarily disabled while pricing and logic are being revised
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* PA sub-questions */}
          {audioServices.includes("pa") && (
            <div className="space-y-8 p-6 border-2 border-primary/20 rounded-sm bg-background animate-in slide-in-from-top-4">
              {/* ── Event setting (requested under Public Address) ── */}
              <div className="space-y-3">
                <Label className="font-black uppercase tracking-widest text-[10px] text-primary">
                  Setting (Public Address)
                </Label>
                <Select
                  value={formData.setting ?? "indoor"}
                  onValueChange={(v) => setValue("setting", v as any)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select setting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indoor">Indoor</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ── Mic counts ── */}
              <div className="space-y-4">
                <Label className="font-black uppercase tracking-widest text-[10px] text-primary flex items-center gap-2">
                  <Mic className="w-4 h-4" /> How many mics will you need?
                </Label>

                <div className="space-y-3">
                  {MIC_TYPES.map(({ key, label, desc, img }) => (
                    <div
                      key={key}
                      className="flex items-center gap-4 p-4 bg-background border-2 rounded-sm"
                    >
                      {/* Product image */}
                      <div className="w-16 h-16 rounded-sm bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden">
                        <Image
                          src={img}
                          alt={label}
                          width={56}
                          height={56}
                          className="object-contain w-14 h-14"
                          onError={(e) => {
                            // Gracefully hide if image not yet uploaded
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{label}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {desc}
                        </div>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        {...register(key as any)}
                        className="w-20 bg-background border-2 text-center"
                        disabled={formData.micNotSure}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/20 border rounded-sm">
                  <Checkbox
                    id="micNotSure"
                    checked={formData.micNotSure ?? false}
                    onCheckedChange={(c) => setValue("micNotSure", !!c)}
                  />
                  <div>
                    <Label
                      htmlFor="micNotSure"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Not Sure — I'll call Sales to discuss my needs
                    </Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Fills in a default / TBD in your quote. A Producer will
                      follow up.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Playback ── */}
              <div className="space-y-4">
                <Label className="font-black uppercase tracking-widest text-[10px] text-primary">
                  Playback of Pre-Recorded Audio?
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Backing tracks, pre-show music, etc.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("playbackEnabled", true)}
                    className={`flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all ${formData.playbackEnabled ? "border-primary bg-background text-primary" : "border-border text-muted-foreground"}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("playbackEnabled", false)}
                    className={`flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all ${!formData.playbackEnabled ? "border-primary bg-background text-primary" : "border-border text-muted-foreground"}`}
                  >
                    No
                  </button>
                </div>
                {formData.playbackEnabled && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 pl-2">
                    <Label className="text-xs font-bold">
                      Will you provide the tracks, or use our Spotify playlists?
                    </Label>
                    <RadioGroup
                      value={formData.playbackSource ?? ""}
                      onValueChange={(v: any) => setValue("playbackSource", v)}
                    >
                      <div className="flex gap-3">
                        <div className="flex items-center space-x-2 p-3 border rounded-sm bg-background flex-1">
                          <RadioGroupItem value="client" id="pb1" />
                          <Label htmlFor="pb1" className="text-sm">
                            I'll provide tracks
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded-sm bg-background flex-1">
                          <RadioGroupItem value="spotify" id="pb2" />
                          <Label htmlFor="pb2" className="text-sm">
                            Use your Spotify playlists
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>

              {/* ── Voice of God ── */}
              <div className="space-y-4">
                <Label className="font-black uppercase tracking-widest text-[10px] text-primary flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Voice of God (VOG)
                  Announcement Mic?
                </Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("vogEnabled", true)}
                    className={`flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all ${formData.vogEnabled ? "border-primary bg-background text-primary" : "border-border text-muted-foreground"}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("vogEnabled", false)}
                    className={`flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all ${!formData.vogEnabled ? "border-primary bg-background text-primary" : "border-border text-muted-foreground"}`}
                  >
                    No
                  </button>
                </div>

                {formData.vogEnabled && (
                  <div className="space-y-5 animate-in slide-in-from-top-2 pl-2">
                    <div className="flex items-center space-x-2 p-3 bg-muted/20 border rounded-sm">
                      <Checkbox
                        id="vogCounted"
                        checked={formData.vogAlreadyCounted ?? false}
                        onCheckedChange={(c) =>
                          setValue("vogAlreadyCounted", !!c)
                        }
                      />
                      <Label
                        htmlFor="vogCounted"
                        className="text-sm cursor-pointer"
                      >
                        I already counted this mic in my mic request above
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold">
                        Mic type at the mixer board?
                      </Label>
                      <RadioGroup
                        value={formData.vogMicType ?? ""}
                        onValueChange={(v: any) => setValue("vogMicType", v)}
                      >
                        <div className="flex gap-3">
                          <div className="flex items-center space-x-2 p-3 border rounded-sm bg-background flex-1">
                            <RadioGroupItem value="handheld" id="vog1" />
                            <Label htmlFor="vog1" className="text-sm">
                              Wireless Handheld
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 border rounded-sm bg-background flex-1">
                            <RadioGroupItem value="wired" id="vog2" />
                            <Label htmlFor="vog2" className="text-sm">
                              Wired Mic
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold">
                        Who makes the VOG announcements?
                      </Label>
                      <RadioGroup
                        value={formData.vogAnnouncer ?? ""}
                        onValueChange={(v: any) => setValue("vogAnnouncer", v)}
                      >
                        <div className="flex gap-3">
                          <div className="flex items-center space-x-2 p-3 border rounded-sm bg-background flex-1">
                            <RadioGroupItem value="team" id="ann1" />
                            <Label htmlFor="ann1" className="text-sm">
                              Someone from our team
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 border rounded-sm bg-background flex-1">
                            <RadioGroupItem value="tech" id="ann2" />
                            <Label htmlFor="ann2" className="text-sm">
                              Your audio tech
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Stage Monitors ── */}
              <div className="space-y-4">
                <Label className="font-black uppercase tracking-widest text-[10px] text-primary">
                  Monitors for On-Stage Talent?
                </Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("monitorsEnabled", true)}
                    className={`flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all ${formData.monitorsEnabled ? "border-primary bg-background text-primary" : "border-border text-muted-foreground"}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("monitorsEnabled", false)}
                    className={`flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all ${!formData.monitorsEnabled ? "border-primary bg-background text-primary" : "border-border text-muted-foreground"}`}
                  >
                    No
                  </button>
                </div>

                {formData.monitorsEnabled && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 pl-2">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-bold whitespace-nowrap">
                        Speaker wedges:
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        {...register("monitors")}
                        className="w-20 bg-background border-2 text-center"
                      />
                      <span className="text-xs text-muted-foreground">
                        (most choose 1–2 per stage)
                      </span>
                    </div>
                    <Card
                      className="border-dashed border-2 cursor-pointer opacity-70 hover:opacity-100"
                      onClick={onRedirect}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-bold">
                          Other monitor type (Call Sales)
                        </span>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* ── Attendance ── */}
              <div className="space-y-3">
                <Label className="font-black uppercase tracking-widest text-[10px] text-primary flex items-center gap-2">
                  <Users className="w-4 h-4" /> Expected Attendance
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Determines the number of speakers needed. Every ~100 people
                  requires an additional speaker. Over 400 attendees requires a
                  custom consultation.
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    max={400}
                    {...register("attendance")}
                    className="max-w-30 bg-background rounded-sm border-2"
                  />
                  <span className="text-sm text-muted-foreground">
                    attendees
                  </span>
                </div>
                {(formData.attendance ?? 0) > 300 &&
                  (formData.attendance ?? 0) <= 400 && (
                    <p className="text-[10px] text-amber-600 font-medium">
                      ⚠️ Approaching limit — over 400 attendees will require a
                      custom consultation.
                    </p>
                  )}
              </div>
            </div>
          )}

      </div>

      {/* More Event AV section is intentionally hidden for now.
          Kept nested under this option while logic/pricing is revised. */}
      <div className="hidden space-y-6">
        <div>
          <h3 className="text-xl font-black tracking-tight uppercase">
            More Event AV
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
            Projectors, TVs, Lighting, Photography
          </p>
        </div>

        {/* ── Projectors ── */}
        <Card
          className={`border-2 rounded-sm transition-all ${formData.wantsProjector ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <Monitor className="text-primary w-5 h-5 shrink-0" />
              <div
                className="flex-1 cursor-pointer"
                onClick={() =>
                  setValue("wantsProjector", !formData.wantsProjector)
                }
              >
                <div className="font-bold">Projector & Screen</div>
                <p className="text-xs text-muted-foreground">
                  Up to ultra short-throw 8k brightness. Requires trucking.
                </p>
              </div>
              <Checkbox
                checked={formData.wantsProjector ?? false}
                onCheckedChange={(c) => setValue("wantsProjector", !!c)}
              />
            </div>

            {formData.wantsProjector && (
              <div className="space-y-5 border-t pt-5 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider">
                    Screen Size
                  </Label>
                  <RadioGroup
                    value={formData.projectorScreenSize ?? ""}
                    onValueChange={(v: any) =>
                      setValue("projectorScreenSize", v)
                    }
                  >
                    <div className="flex gap-3">
                      {["12ft", "16ft", "not-sure"].map((s) => (
                        <div
                          key={s}
                          className="flex items-center space-x-2 p-3 border rounded-sm bg-background flex-1"
                        >
                          <RadioGroupItem value={s} id={`sc-${s}`} />
                          <Label
                            htmlFor={`sc-${s}`}
                            className="text-sm capitalize"
                          >
                            {s}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider">
                    How many screens?
                  </Label>
                  <div className="flex gap-3">
                    {[1, 2].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setValue("projectorScreenCount", n)}
                        className={`flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all ${formData.projectorScreenCount === n ? "border-primary bg-background text-primary" : "border-border text-muted-foreground"}`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={onRedirect}
                      className="flex-1 p-3 rounded-sm border-2 border-dashed font-bold text-sm text-muted-foreground hover:opacity-100 opacity-70"
                    >
                      2+ (Call Sales)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Big Screen TVs ── */}
        <Card
          className={`border-2 rounded-sm transition-all ${formData.wantsTVs ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <Monitor className="text-primary w-5 h-5 shrink-0" />
              <div
                className="flex-1 cursor-pointer"
                onClick={() => setValue("wantsTVs", !formData.wantsTVs)}
              >
                <div className="font-bold">Big Screen TVs</div>
                <p className="text-xs text-muted-foreground">
                  85" or 75" display screens. Requires trucking.
                </p>
              </div>
              <Checkbox
                checked={formData.wantsTVs ?? false}
                onCheckedChange={(c) => setValue("wantsTVs", !!c)}
              />
            </div>

            {formData.wantsTVs && (
              <div className="space-y-5 border-t pt-5 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider">
                    Screen Size
                  </Label>
                  <RadioGroup
                    value={formData.tvSize ?? ""}
                    onValueChange={(v: any) => setValue("tvSize", v)}
                  >
                    <div className="flex gap-3">
                      {[
                        { v: "85", l: '85"' },
                        { v: "75", l: '75"' },
                        { v: "other", l: "Other" },
                      ].map(({ v, l }) => (
                        <div
                          key={v}
                          className="flex items-center space-x-2 p-3 border rounded-sm bg-background flex-1"
                        >
                          <RadioGroupItem value={v} id={`tv-${v}`} />
                          <Label htmlFor={`tv-${v}`} className="text-sm">
                            {l}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider">
                    How many?
                  </Label>
                  <div className="flex gap-3">
                    {[1, 2].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setValue("tvCount", n)}
                        className={`flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all ${formData.tvCount === n ? "border-primary bg-background text-primary" : "border-border text-muted-foreground"}`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={onRedirect}
                      className="flex-1 p-3 rounded-sm border-2 border-dashed font-bold text-sm text-muted-foreground hover:opacity-100 opacity-70"
                    >
                      2+ (Call Sales)
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider">
                    TV Stand Type
                  </Label>
                  <RadioGroup
                    value={formData.tvStand ?? ""}
                    onValueChange={(v: any) => setValue("tvStand", v)}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { v: "truss", l: "8ft Truss" },
                        { v: "cart", l: "Cart" },
                        { v: "floor", l: "Floor Stand" },
                      ].map(({ v, l }) => (
                        <div
                          key={v}
                          className="flex items-center space-x-2 p-3 border rounded-sm bg-background"
                        >
                          <RadioGroupItem value={v} id={`stand-${v}`} />
                          <Label htmlFor={`stand-${v}`} className="text-sm">
                            {l}
                          </Label>
                        </div>
                      ))}
                      <div
                        className="flex items-center space-x-2 p-3 border-dashed border-2 rounded-sm cursor-pointer opacity-70 hover:opacity-100"
                        onClick={onRedirect}
                      >
                        <span className="text-sm font-bold">
                          Other (Call Sales)
                        </span>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Confidence Monitors ── */}
        <Card
          className={`border-2 rounded-sm transition-all ${formData.wantsConfidenceMonitors ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <Monitor className="text-primary w-5 h-5 shrink-0" />
              <div
                className="flex-1 cursor-pointer"
                onClick={() =>
                  setValue(
                    "wantsConfidenceMonitors",
                    !formData.wantsConfidenceMonitors,
                  )
                }
              >
                <div className="font-bold">Confidence Monitors</div>
                <p className="text-xs text-muted-foreground">
                  Presenter-facing screens showing slides / notes.
                </p>
              </div>
              <Checkbox
                checked={formData.wantsConfidenceMonitors ?? false}
                onCheckedChange={(c) =>
                  setValue("wantsConfidenceMonitors", !!c)
                }
              />
            </div>

            {formData.wantsConfidenceMonitors && (
              <div className="border-t pt-5 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider">
                    How many?
                  </Label>
                  <div className="flex gap-3">
                    {[1, 2].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setValue("confidenceMonitorCount", n)}
                        className={`flex-1 p-3 rounded-sm border-2 font-bold text-sm transition-all ${formData.confidenceMonitorCount === n ? "border-primary bg-background text-primary" : "border-border text-muted-foreground"}`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={onRedirect}
                      className="flex-1 p-3 rounded-sm border-2 border-dashed font-bold text-sm text-muted-foreground opacity-70 hover:opacity-100"
                    >
                      2+ / Not Sure (Call Sales)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Lighting ── */}
        <Card
          className={`border-2 rounded-sm transition-all ${lightingServices.length > 0 ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <Lightbulb className="text-primary w-5 h-5 shrink-0" />
              <div className="flex-1">
                <div className="font-bold">Lighting</div>
                <p className="text-xs text-muted-foreground">
                  Stage wash, uplights, spotlights, and more
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Stage Wash */}
              <div className="flex items-center space-x-3 p-4 border rounded-sm">
                <Checkbox
                  id="stageWash"
                  checked={lightingServices.includes("stage-wash")}
                  onCheckedChange={() =>
                    toggleArray("lightingServices", "stage-wash")
                  }
                />
                <div>
                  <Label
                    htmlFor="stageWash"
                    className="font-bold text-sm cursor-pointer"
                  >
                    Stage Wash
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    2hr setup, 1hr strike
                  </p>
                </div>
              </div>

              {/* Uplights on stage */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-4 border rounded-sm">
                  <Checkbox
                    id="uplightsStage"
                    checked={lightingServices.includes("uplights-stage")}
                    onCheckedChange={() =>
                      toggleArray("lightingServices", "uplights-stage")
                    }
                  />
                  <div>
                    <Label
                      htmlFor="uplightsStage"
                      className="font-bold text-sm cursor-pointer"
                    >
                      Uplights on Stage
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      30 min setup per 10ft length
                    </p>
                  </div>
                </div>
                {lightingServices.includes("uplights-stage") && (
                  <div className="flex items-center gap-3 pl-6 animate-in slide-in-from-top-2">
                    <Label className="text-xs font-bold whitespace-nowrap">
                      Stage width (ft):
                    </Label>
                    <Input
                      type="number"
                      min={10}
                      step={10}
                      {...register("stageWashWidth")}
                      className="w-24 bg-background border-2 text-center"
                    />
                  </div>
                )}
              </div>

              {/* Wireless uplights */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-4 border rounded-sm">
                  <Checkbox
                    id="wirelessUplights"
                    checked={lightingServices.includes("wireless-uplights")}
                    onCheckedChange={() =>
                      toggleArray("lightingServices", "wireless-uplights")
                    }
                  />
                  <div>
                    <Label
                      htmlFor="wirelessUplights"
                      className="font-bold text-sm cursor-pointer"
                    >
                      Wireless Uplights
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Deployed in packs of 6. Requires trucking.
                    </p>
                  </div>
                </div>
                {lightingServices.includes("wireless-uplights") && (
                  <div className="flex items-center gap-3 pl-6 animate-in slide-in-from-top-2">
                    <Label className="text-xs font-bold whitespace-nowrap">
                      Number of uplights:
                    </Label>
                    <RadioGroup
                      value={String(formData.wirelessUplightCount ?? 6)}
                      onValueChange={(v) =>
                        setValue("wirelessUplightCount", parseInt(v))
                      }
                    >
                      <div className="flex gap-2">
                        {[6, 12, 18, 24].map((n) => (
                          <div
                            key={n}
                            className="flex items-center space-x-1 p-2 border rounded-lg bg-background"
                          >
                            <RadioGroupItem value={String(n)} id={`ul-${n}`} />
                            <Label htmlFor={`ul-${n}`} className="text-xs">
                              {n}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>

              {/* Spotlight */}
              <div className="flex items-center space-x-3 p-4 border rounded-sm">
                <Checkbox
                  id="spotlight"
                  checked={lightingServices.includes("spotlight")}
                  onCheckedChange={() =>
                    toggleArray("lightingServices", "spotlight")
                  }
                />
                <div>
                  <Label
                    htmlFor="spotlight"
                    className="font-bold text-sm cursor-pointer"
                  >
                    Spotlight / Follow-spot
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    1hr setup, 30min strike. Requires trucking.
                  </p>
                </div>
              </div>

              {/* Other lighting */}
              <div
                className="flex items-center space-x-3 p-4 border-dashed border-2 rounded-sm cursor-pointer opacity-70 hover:opacity-100"
                onClick={onRedirect}
              >
                <AlertCircle className="w-4 h-4" />
                <span className="font-bold text-sm">
                  Other Lighting (Call Sales)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Photography ── */}
        <Card
          className={`border-2 rounded-sm transition-all ${photographyServices.length > 0 ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <Camera className="text-primary w-5 h-5 shrink-0" />
              <div>
                <div className="font-bold">Photography</div>
                <p className="text-xs text-muted-foreground">
                  Select all that apply
                </p>
              </div>
            </div>
            {[
              { id: "photo-booth", label: "Photo Booth" },
              {
                id: "event-photo",
                label: "General Business Event Photography",
              },
              { id: "portraits", label: "Portraits" },
            ].map(({ id, label }) => (
              <div
                key={id}
                className="flex items-center space-x-3 p-4 border rounded-sm"
              >
                <Checkbox
                  id={id}
                  checked={photographyServices.includes(id)}
                  onCheckedChange={() => toggleArray("photographyServices", id)}
                />
                <Label
                  htmlFor={id}
                  className="font-bold text-sm cursor-pointer"
                >
                  {label}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Other AV */}
        <Card
          className="border-2 rounded-sm border-dashed cursor-pointer opacity-70 hover:opacity-100"
          onClick={onRedirect}
        >
          <CardContent className="flex items-center gap-4 p-5">
            <AlertCircle className="w-5 h-5" />
            <div>
              <div className="font-bold text-sm">
                Staging, Power, PowerPoint Support, or Other
              </div>
              <p className="text-xs text-muted-foreground">
                Call Sales for these services
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-6 text-[14px] text-center pace-y-1">
        <p className="text-primary font-bold">
          Outdoor audio, 2+ speakers, wireless uplights, and all
          screen/projection/lighting require trucking
        </p>
      </div>
    </div>
  );
}
