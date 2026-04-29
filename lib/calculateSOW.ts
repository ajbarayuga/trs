import { QuoteFormData } from "@/schema/quote";
import { RATES, RUSH_FEE_RATE } from "@/lib/pricing";
import { shouldRedirectToSales } from "@/lib/quoteRedirect";
import { SERVICE_WINDOWS as SW } from "@/lib/constants";
import { getHolidayRate, isRushBooking } from "@/lib/holidays";

export interface LineItem {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export const calculateSOW = (data: QuoteFormData) => {
  const items: LineItem[] = [];
  let needsTrucking = false;

  // ── Sanitize: derive active values from parent toggles ───────────────────
  //
  // Form state preserves sub-question answers even when a parent service is
  // deselected (so re-selecting it restores the answers). calculateSOW must
  // only act on data whose parent is currently active.

  const isVideoActive = data.services.includes("video");
  const videoBuiltInActive = isVideoActive && (data.videoBuiltInEnabled ?? false);
  const videoTRSActive = isVideoActive && (data.videoTRSEnabled ?? false);
  const builtInEditing = videoBuiltInActive ? (data.videoBuiltInEditing ?? []) : [];
  const trsEditing = videoTRSActive ? (data.videoTRSEditing ?? []) : [];

  const hasLecture = builtInEditing.includes("lecture") || trsEditing.includes("lecture");
  const hasHighlight = trsEditing.includes("highlight");
  const hasAnyVideo = videoBuiltInActive || videoTRSActive;

  const activeShortsCount =
    (builtInEditing.includes("social-short") ? (data.videoBuiltInSocialShortsCount ?? 0) : 0) +
    (trsEditing.includes("social-short") ? (data.videoTRSSocialShortsCount ?? 0) : 0);

  const isStreamingActive = data.services.includes("streaming");
  const isPAActive = (data.audioServices ?? []).includes("pa");

  if (shouldRedirectToSales(data)) {
    return { items: [], shouldRedirect: true };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const R = RATES; // shorthand

  const round = (n: number) => Number(n.toFixed(2));

  const addItem = (
    name: string,
    desc: string,
    qty: number,
    unit: string,
    rate: number,
  ) => {
    items.push({ name, description: desc, quantity: qty, unit, rate, total: round(qty * rate) });
  };

  // ── Labor subtotal tracking (for holiday + rush surcharges) ───────────────
  //
  // Only labor totals are surcharged for holidays; rush fee applies to everything.
  let laborSubtotal = 0;

  const addLaborItem = (
    name: string,
    desc: string,
    qty: number,
    unit: string,
    rate: number,
  ) => {
    const total = round(qty * rate);
    items.push({ name, description: desc, quantity: qty, unit, rate, total });
    laborSubtotal += total;
  };

  // ── 3-tier Production Lead billing ───────────────────────────────────────
  //
  // < 8h total on site → hourly
  // 8–10h             → flat day rate
  // > 10h             → day rate + overtime per hour over 10
  //
  // totalHours = maxSetupMins/60 + eventDuration + maxStrikeMins/60
  // across all active services for the booking.
  const billProductionLead = (totalHours: number, desc: string) => {
    const h = Math.max(0.5, totalHours);
    if (h < 8) {
      const hrs = Math.round(h * 2) / 2; // round to nearest 0.5h
      addLaborItem("Production Lead (Hourly)", desc, hrs, "hrs", R.labor.productionLead);
    } else if (h <= 10) {
      addLaborItem("Production Lead (Day Rate)", desc, 1, "day", R.labor.plDayRate);
    } else {
      const otHours = Math.round((h - 10) * 2) / 2;
      addLaborItem("Production Lead (Day Rate)", desc, 1, "day", R.labor.plDayRate);
      addLaborItem(
        "Production Lead Overtime (Hourly)",
        "Hourly rate to cover anything over 10 hr daily rate.",
        otHours,
        "hrs",
        R.labor.plOvertime,
      );
    }
  };

  const eventDuration = data.hasDuration ? (data.durationHours ?? 4) : 4;
  const isBuiltInStreaming = isStreamingActive && data.cameraSource === "built-in";
  const hasBuiltInAudio = data.builtInAV?.includes("audio");
  const hasBuiltInPJ = data.builtInAV?.includes("projector");
  const hasBuiltInTVs = data.builtInAV?.includes("tvs");

  // ── More Event AV section is hidden in the UI while being revised ─────────
  // Force to off regardless of saved draft data so no phantom charges appear.
  // Restore data.* references here when each sub-section is re-enabled.
  const wantsProjector = false;
  const wantsTVs = false;
  const wantsConfidenceMonitors = false;

  const hasAnyCoreAVService =
    isStreamingActive || isPAActive || hasAnyVideo;

  // ── 1. VIDEO PRODUCTION ──────────────────────────────────────────────────

  if (data.eventType === "studio") {
    const studioDuration = data.studioHasDuration
      ? (data.studioDurationHours ?? 4)
      : 4;

    const studioVideoTypes = isVideoActive ? (data.videoTypes ?? []) : [];
    const isStudioProduction = studioVideoTypes.some((v) =>
      ["podcast", "web-video"].includes(v),
    );

    if (isStudioProduction) {
      // 2.5h setup + 1.5h packup = 4h overhead, plus recording time
      const studioHrs = (SW.studio.setup + SW.studio.strike) / 60 + studioDuration;
      billProductionLead(studioHrs, "Setup (2.5h) & Packup (1.5h)");
      addItem(
        "Studio Camera Kit",
        "2x Mirrorless Kit + Studio Lighting",
        1,
        "set",
        R.equipment.studioCameraKit,
      );
    }

    if (studioVideoTypes.includes("podcast")) {
      const episodes = Math.max(1, data.podcastEpisodes ?? 1);
      addItem(
        "Podcast Editing",
        `Edit for ${episodes} episode(s)`,
        episodes,
        "unit",
        R.postProduction.podcastEdit,
      );
    }

    if (studioVideoTypes.includes("web-video")) {
      const videoQty = Math.max(1, data.webVideoCount ?? 1);
      const filmingUnits = Math.max(
        1,
        Math.max(data.webVideoPeople ?? 1, videoQty),
      );
      addItem(
        "Web Video Filming Time",
        `${filmingUnits} × 30min slot(s)`,
        filmingUnits,
        "slot",
        R.postProduction.webVideoFilming,
      );
      addItem(
        "Web Video Editing",
        `Edit for ${videoQty} video(s)`,
        videoQty,
        "unit",
        R.postProduction.webVideoEdit,
      );
    }
  }

  if (data.eventType === "live") {
    if (hasHighlight) {
      const isHalfDay = eventDuration < 4;
      addItem(
        "Mirrorless Kit (Highlight)",
        isHalfDay ? "Half Day Rate" : "Full Day Rate",
        1,
        "day",
        isHalfDay ? R.equipment.mirrorlessHalfDay : R.equipment.mirrorlessFullDay,
      );
      addItem("Event Highlight Edit", "Creative highlight reel", 1, "edit", R.postProduction.highlightEdit);
    }

    if (hasLecture) {
      const talkCount = Math.max(1, data.lectureTalksCount ?? 1);
      const dur = data.lectureTalkDuration ?? "up to 1hr";
      const withPPT = data.lecturePPT ?? false;
      const hasRawFootage = (data.videoBuiltInRawFootage ?? false) || (data.videoTRSRawFootage ?? false);
      const editRate =
        dur === "up to 3hr"
          ? withPPT ? R.postProduction.lectureEdit3hrWithPPT : R.postProduction.lectureEdit3hrNoPPT
          : dur === "up to 2hr"
          ? withPPT ? R.postProduction.lectureEdit2hrWithPPT : R.postProduction.lectureEdit2hrNoPPT
          : withPPT ? R.postProduction.lectureEdit1hrWithPPT : R.postProduction.lectureEdit1hrNoPPT;

      // Built-in cameras = 1 angle (no kit); TRS cameras = N angles + kit
      const builtInAngles = builtInEditing.includes("lecture") ? 1 : 0;
      const trsAnglesCount = trsEditing.includes("lecture") ? Math.max(1, data.videoTRSCameraAngles ?? 1) : 0;
      const totalAngles = Math.max(1, builtInAngles + trsAnglesCount);

      if (trsAnglesCount > 0) {
        addItem("Camcorder & AV Kit", "Lecture/Panel Essential Kit", 1, "set", R.equipment.camcorderKit);
        if (trsAnglesCount > 1) {
          addItem("Additional Camera Kit", `${trsAnglesCount - 1} extra angle(s)`, trsAnglesCount - 1, "set", R.equipment.additionalCamKit);
        }
      }

      // Raw footage suppresses all post-production editing
      if (!hasRawFootage) {
        const editName =
          dur === "up to 3hr"
            ? withPPT ? "3 hr lecture w/ PPT" : "Lecture or Event up to 3hrs, no PPT"
            : dur === "up to 2hr"
            ? withPPT ? "Lecture or Event w/ PPT, up to 2hrs" : "Lecture or Event, no PPT, up to 2hrs"
            : withPPT ? "Lecture w/ PPT, up to 1 hr" : "Lecture or Event - No PPT, up to 1 hr runtime";
        const editDesc = withPPT
          ? "Standard edit package. Details in Technical Scope. Includes Power-Point slides. Price per camera angle"
          : "Standard edit package. Details in Technical Scope. This package can be used for panel discussions. Price per camera angle";
        addItem(editName, editDesc, talkCount * totalAngles, "edit", editRate);
      }
    }
  }

  // ── 2. LIVE STREAMING ────────────────────────────────────────────────────

  if (isStreamingActive) {
    const camCount = parseInt(data.cameraCount || "1") || 1;

    // Our equipment: TRS provides cameras AND streaming system
    if (!isBuiltInStreaming) {
      addItem(
        "Stream Kit",
        "Includes high-performance computer, video switcher/encoder, HDMI cable for up to 4 video inputs, extra laptop to monitor stream output, extension cord, power strip",
        1,
        "set",
        R.equipment.streamControlKit,
      );
      addItem(
        "Camcorder Kit",
        "Includes camcorder, extra tall tripod (8'), XLR audio cable, HDMI cable, extension cord, power strip, and SD cards",
        camCount,
        "set",
        R.equipment.camcorderKit,
      );
    }

    // Stream Link: optional (self-serve if DIY is selected)
    if (!data.diyStream) {
      addItem(
        "Stream Link Creation",
        "Creation and configuration of the streaming or virtual event link (e.g., webinar or meeting platform). This includes host account setup, adjusting appropriate event settings, and coordinating invitations for panelists or guests.",
        1,
        "prep",
        R.streaming.streamLinkSetup,
      );
    }

    // On-screen graphics prep: optional
    if (data.streamGraphics) {
      addItem(
        "Stream Graphics Prep",
        "We create a title screen and lower thirds for your production, following your brand's style guide. If you would like to show more than 25 names onscreen, there may be an additional charge.",
        1,
        "prep",
        R.streaming.streamGraphicsPrep,
      );
    }
  }

  // Required misc kit for onsite productions.
  // Spec: events ≤4h get Half Day rate; 5h+ get full rate.
  if (data.eventType === "live" && hasAnyCoreAVService) {
    const isHalfDayKit = eventDuration <= 4;
    const avKitDesc =
      "Includes a Laptop, power-point clicker, HDMI cable, video scaler & voltage regulator, aux cord, USB adapters, thumbdrive, batteries, Humbuster noise reducer for audio signals, and audio cable adapters. Required for all onsite productions";
    addItem(
      isHalfDayKit ? "AV Essential Kit (Half Day)" : "AV Essential Kit",
      isHalfDayKit
        ? `${avKitDesc}. Half Day Rate applies to events 4 hours or less`
        : avKitDesc,
      1,
      "set",
      isHalfDayKit ? R.equipment.avEssentialKitHalfDay : R.equipment.avEssentialKit,
    );
  }

  // ── 3. SOCIAL SHORTS ─────────────────────────────────────────────────────

  if (activeShortsCount > 0) {
    addItem(
      "Social Media Reel",
      "A 1-minute social media reel.",
      activeShortsCount,
      "short",
      R.postProduction.socialShortEdit,
    );

    // Social shorts are sourced from the video production cameras (built-in or TRS).
    // No additional mirrorless kit needed.
  }

  // ── 4. AUDIO SERVICES ────────────────────────────────────────────────────

  if (isPAActive) {
    const isOutdoor = data.setting === "outdoor";

    // Audio kit — skipped if venue has built-in sound system
    if (!hasBuiltInAudio) {
      addItem(
        isOutdoor ? "Outdoor Audio Kit" : "Indoor Audio Kit",
        isOutdoor ? "Full outdoor PA system" : "Full indoor PA system",
        1,
        "set",
        isOutdoor ? R.equipment.outdoorAudioKit : R.equipment.indoorAudioKit,
      );
    }

    // Speaker algorithm: base kit covers first 100 people, +1 speaker per 100 after
    const extraSpeakers = Math.max(
      0,
      Math.floor((data.attendance ?? 0) / 100) - 1,
    );
    if (extraSpeakers > 0) {
      addItem(
        "Additional Speakers",
        `${extraSpeakers} extra speaker(s) for ${data.attendance} attendees`,
        extraSpeakers,
        "unit",
        R.equipment.extraSpeaker,
      );
      // Spec: more than 2 total speakers = trucking
      // Base kit = 1 speaker, extraSpeakers >= 1 means total >= 2
      if (extraSpeakers >= 1) needsTrucking = true;
    }

    // Mics — skipped if venue has built-in sound system
    if (!hasBuiltInAudio) {
      // 2026 kit model: kits replace per-unit billing
      const micKits: { count: number | undefined; name: string; rate: number }[] = [
        {
          count: data.micWirelessComboKits,
          name: "Wireless Combo Kit",
          rate: R.mics.wirelessComboKit,
        },
        {
          count: data.micWiredMicKits,
          name: "Wired Mic Kit (SM58)",
          rate: R.mics.wiredMicKit,
        },
        {
          count: data.micGooseneckMics,
          name: "Gooseneck Mic",
          rate: R.mics.gooseneckMic,
        },
      ];
      for (const { count, name, rate } of micKits) {
        if ((count ?? 0) > 0) {
          addItem(name, `${count} kit(s)`, count ?? 1, "kit", rate);
        }
      }
      if (data.micRockBand) {
        addItem(
          "Rock Band Mic Locker",
          "Full band mic kit — PL to discuss specifics",
          1,
          "set",
          R.mics.rockBandLocker,
        );
      }
    }

    // VOG mic — only add if not already counted in mic section above
    if (data.vogEnabled && !data.vogAlreadyCounted) {
      const vogRate =
        data.vogMicType === "wired" ? R.mics.vogWired : R.mics.vogWireless;
      addItem(
        "VOG Announcement Mic",
        data.vogMicType === "wired" ? "Wired" : "Wireless Handheld",
        1,
        "unit",
        vogRate,
      );
    }

    // Stage monitors
    if (data.monitorsEnabled && (data.monitors ?? 0) > 0) {
      addItem(
        "Stage Monitor (Wedge)",
        `${data.monitors} unit(s)`,
        data.monitors ?? 1,
        "unit",
        R.equipment.stageMonitor,
      );
    }

  }

  // ── 5. MORE EVENT AV ─────────────────────────────────────────────────────

  // Projector & Screen — skipped if venue has built-in projector
  if (wantsProjector && !hasBuiltInPJ) {
    const screenCount = data.projectorScreenCount ?? 1;
    // "not-sure" falls back to 12ft — label it "TBD (est. 12ft)" so the quote is transparent
    const is16ft = data.projectorScreenSize === "16ft";
    const isNotSure = data.projectorScreenSize === "not-sure" || !data.projectorScreenSize;
    const screenRate = is16ft
      ? R.equipment.projectorScreen16ft
      : R.equipment.projectorScreen12ft;
    const screenLabel = is16ft ? "16ft" : isNotSure ? "12ft (TBD — confirm with PL)" : "12ft";

    addItem(
      "Projector",
      "Ultra short-throw, 8k brightness",
      1,
      "unit",
      R.equipment.projector,
    );
    addItem(
      "Projection Screen",
      screenLabel,
      screenCount,
      "unit",
      screenRate,
    );

    addItem(
      "Projector Accessory Kit",
      "Cables, mounts, accessories",
      1,
      "set",
      R.equipment.projectorAccessories,
    );

    if (screenCount > 1) {
      addItem(
        "SDI Kit (Extra Screens)",
        `${screenCount - 1} extra screen(s)`,
        screenCount - 1,
        "set",
        R.equipment.sdiKit,
      );
    }
    needsTrucking = true;
  }

  // Big Screen TVs — skipped if venue has built-in TVs
  if (wantsTVs && !hasBuiltInTVs) {
    const tvCount = data.tvCount ?? 1;
    // "other" and unset fall back to 75" — label it visibly so PL can confirm
    const tvIs85 = data.tvSize === "85";
    const tvIsOther = data.tvSize === "other" || !data.tvSize;
    const tvRate = tvIs85 ? R.equipment.tv85inch : R.equipment.tv75inch;
    const tvLabel = tvIs85 ? `85"` : tvIsOther ? `75" (TBD — confirm with PL)` : `75"`;

    addItem(
      `Big Screen TV (${tvLabel})`,
      `${tvCount} unit(s)`,
      tvCount,
      "unit",
      tvRate,
    );
    addItem(
      "TV Accessory Kit",
      "Cables and accessories",
      1,
      "set",
      R.equipment.tvAccessories,
    );

    if (tvCount > 1) {
      addItem(
        "SDI Kit (Extra TVs)",
        `${tvCount - 1} extra TV(s)`,
        tvCount - 1,
        "set",
        R.equipment.sdiKit,
      );
    }
    needsTrucking = true;
  }

  // Confidence Monitors
  if (wantsConfidenceMonitors) {
    const cmCount = data.confidenceMonitorCount ?? 1;
    addItem(
      "Confidence Monitor",
      `${cmCount} unit(s)`,
      cmCount,
      "unit",
      R.equipment.confidenceMonitor,
    );
    needsTrucking = true;
  }

  // Lighting — hidden in UI, forced off (see More Event AV guard above)
  const lighting: string[] = [];

  if (lighting.includes("stage-wash")) {
    addItem(
      "Stage Wash Kit",
      "2hr setup, 1hr strike",
      1,
      "set",
      R.equipment.stagingWashKit,
    );
  }

  if (lighting.includes("uplights-stage")) {
    const kits = Math.max(1, Math.ceil((data.stageWashWidth ?? 10) / 10));
    addItem(
      "Stage Uplights",
      `${kits} kit(s) for ${data.stageWashWidth ?? 10}ft stage`,
      kits,
      "kit",
      R.equipment.stageUplightKit,
    );
  }

  if (lighting.includes("wireless-uplights")) {
    const packs = Math.max(1, Math.floor((data.wirelessUplightCount ?? 6) / 6));
    addItem(
      "Wireless Uplights",
      `${data.wirelessUplightCount ?? 6} units in ${packs} pack(s)`,
      packs,
      "pack",
      R.equipment.wirelessUplightPack,
    );
    needsTrucking = true;
  }

  if (lighting.includes("spotlight")) {
    addItem(
      "Spotlight / Follow-spot",
      "1hr setup, 30min strike",
      1,
      "set",
      R.equipment.spotlight,
    );
    needsTrucking = true;
  }

  // Photography — hidden in UI, forced off (see More Event AV guard above)
  const photo: string[] = [];
  if (photo.includes("photo-booth"))
    addItem(
      "Photo Booth",
      "Full event",
      1,
      "service",
      R.photography.photoBooth,
    );
  if (photo.includes("event-photo"))
    addItem(
      "Event Photography",
      "General business event",
      1,
      "service",
      R.photography.eventPhotography,
    );
  if (photo.includes("portraits"))
    addItem(
      "Portrait Photography",
      "Portrait session",
      1,
      "service",
      R.photography.portraits,
    );

  // ── 6. PRODUCTION LEAD ───────────────────────────────────────────────────
  //
  // Single PL billed once per booking using the 3-tier model.
  // Total on-site hours = max setup window + event duration + max strike window
  // across all active services.

  if (data.eventType === "live" && hasAnyCoreAVService) {
    let maxSetupMins = 0;
    let maxStrikeMins = 0;

    const trackWindow = (w: { setup: number; strike: number }) => {
      maxSetupMins = Math.max(maxSetupMins, w.setup);
      maxStrikeMins = Math.max(maxStrikeMins, w.strike);
    };

    if (isStreamingActive) trackWindow(isBuiltInStreaming ? SW.streamingBuiltIn : SW.streamingOurEquip);
    if (isPAActive) trackWindow(data.setting === "outdoor" ? SW.paOutdoor : SW.paIndoor);
    if (hasLecture) trackWindow(SW.lecture);
    if (hasHighlight) trackWindow(SW.highlight);
    if (wantsProjector && !hasBuiltInPJ) {
      trackWindow(data.projectorScreenSize === "16ft" ? SW.projector16ft : SW.projector12ft);
    }
    if (wantsTVs && !hasBuiltInTVs) trackWindow(SW.tv);
    if (wantsConfidenceMonitors) trackWindow(SW.confidenceMonitor);
    if (lighting.includes("stage-wash")) trackWindow(SW.stageWash);
    if (lighting.includes("spotlight")) trackWindow(SW.spotlight);
    if (lighting.includes("uplights-stage")) {
      const kits = Math.max(1, Math.ceil((data.stageWashWidth ?? 10) / 10));
      trackWindow({ setup: SW.stageUplightsPerKit.setup * kits, strike: SW.stageUplightsPerKit.strike * kits });
    }
    if (lighting.includes("wireless-uplights")) {
      const packs = Math.max(1, Math.floor((data.wirelessUplightCount ?? 6) / 6));
      trackWindow({ setup: SW.wirelessUplightsPerPack.setup * packs, strike: SW.wirelessUplightsPerPack.strike * packs });
    }

    const fmtMins = (m: number) =>
      m >= 60 ? `${m / 60}h` : `${m}min`;
    const plHours = maxSetupMins / 60 + eventDuration + maxStrikeMins / 60;
    billProductionLead(
      plHours,
      "Production Leads are cross-trained AV professionals with experience leading projects. For solo projects, we recommend hiring a production lead because they have the experience and self-management skills to offer you turn-key service.",
    );

    // Stream Tech: non-built-in streaming only. Always billed at day rate.
    // OT applies if total on-site hours exceed 10h (same window as Production Lead).
    if (isStreamingActive && !isBuiltInStreaming) {
      const stDesc =
        "Stream Techs have experience producing hybrid events. They are familiar with the major streaming platforms, and have experience switching cameras, cuing graphics, and media playback in real time. They will monitor the stream output from a 2nd computer throughout the event, to ensure the remote audience is receiving a quality output.";
      addLaborItem("Stream Tech (Day Rate)", stDesc, 1, "day", R.labor.streamTechDayRate);
      if (plHours > 10) {
        const stOtHours = Math.round((plHours - 10) * 2) / 2;
        addLaborItem("Stream Tech Overtime (Hourly)", stDesc, stOtHours, "hrs", R.labor.streamTechOT);
      }
    }
  }

  // ── 7. TRUCKING ──────────────────────────────────────────────────────────

  if (needsTrucking) {
    addItem(
      "Trucking",
      "Equipment transport & logistics",
      1,
      "flat",
      R.equipment.trucking,
    );
  }

  // ── 8. HOLIDAY RATE SURCHARGE ────────────────────────────────────────────
  //
  // Applies only when a confirmed event date falls on a recognized holiday.
  // Only labor items are surcharged (equipment and post-production are not).
  // The surcharge is a separate line item rather than inflating individual
  // labor rates so the base breakdown remains transparent.

  const holidayInfo =
    data.hasDate && data.eventDate ? getHolidayRate(data.eventDate) : null;

  if (holidayInfo && laborSubtotal > 0) {
    const surchargeRate = holidayInfo.multiplier - 1; // 0.5 for 1.5×, 1.0 for 2×
    const surchargeAmt = round(laborSubtotal * surchargeRate);
    addItem(
      `Holiday Rate — ${holidayInfo.name}`,
      `${Math.round(surchargeRate * 100)}% labor surcharge (${holidayInfo.multiplier}× total)`,
      1,
      "flat",
      surchargeAmt,
    );
  }

  // ── 9. RUSH FEE ──────────────────────────────────────────────────────────
  //
  // Applied when the event is fewer than 2 full business days away (per Terms §3).
  // Calculated as a % of the current subtotal (after holiday surcharge if any).

  const qualifiesForRush =
    data.hasDate &&
    data.eventDate &&
    isRushBooking(data.eventDate);

  if (qualifiesForRush) {
    const preRushSubtotal = items.reduce((s, i) => s + i.total, 0);
    addItem(
      "Rush Fee (20%)",
      "Event booked with < 2 business days' notice",
      1,
      "flat",
      round(preRushSubtotal * RUSH_FEE_RATE),
    );
  }

  // ── 10. DISCOUNT ─────────────────────────────────────────────────────────
  // 10% off labor for Emory or large-order qualifying clients.

  const org = (data.organization ?? "").toLowerCase();
  const qualifiesForPlDiscount =
    laborSubtotal > 0 &&
    (org.includes("emory") || items.reduce((s, i) => s + i.total, 0) >= 10_000);
  if (qualifiesForPlDiscount) {
    addItem(
      "DISCOUNT",
      "Discount - Production Lead (10% off labor) for qualifying clients",
      1,
      "flat",
      round(-laborSubtotal * 0.1),
    );
  }

  return { items, shouldRedirect: false };
};
