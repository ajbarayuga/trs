import { QuoteFormData } from "@/schema/quote";
import { RATES, DAY_RATE_MIN_HOURS, RUSH_FEE_RATE } from "@/lib/pricing";
import { shouldRedirectToSales } from "@/lib/quoteRedirect";
import { SERVICE_WINDOWS as SW, overheadHours } from "@/lib/constants";
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

  const activeVideoTypes = data.services.includes("video")
    ? (data.videoTypes ?? [])
    : [];

  const activeShortsCount = data.wantsSocialShorts
    ? (data.socialShortsCount ?? 0)
    : 0;

  const isStreamingActive = data.services.includes("streaming");
  const isPAActive = data.audioServices.includes("pa");

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

  // ── Day-rate billing ──────────────────────────────────────────────────────
  //
  // The Production Lead is billed strictly hourly (actual hours).
  // All other techs are on a day-rate baseline: the customer is charged for
  // at least DAY_RATE_MIN_HOURS (10h) per booking regardless of time on site.
  // Hours over 10 bill at the same hourly rate (overtime for everyone).
  //
  // Usage:  addItem("Streaming Tech", desc, techHrs(streamHrs), "hrs", rate)
  const techHrs = (actual: number) => Math.max(DAY_RATE_MIN_HOURS, actual);

  // ── Labor subtotal tracking (for holiday + rush surcharges) ───────────────
  //
  // We accumulate only labor totals so the holiday multiplier applies to labor
  // only (not equipment or post-production), and rush fee applies to everything.
  let laborSubtotal = 0;
  let productionLeadHourlySubtotal = 0;
  let productionLeadHourlyHours = 0;

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

  const addProductionLeadItem = (desc: string, qtyHours: number) => {
    const roundedHours = Math.max(1, Math.round(qtyHours));
    addLaborItem(
      "-- Production Lead (Hourly)",
      desc,
      roundedHours,
      "hrs",
      R.labor.productionLead,
    );
    productionLeadHourlySubtotal += round(roundedHours * R.labor.productionLead);
    productionLeadHourlyHours += roundedHours;
  };

  const eventDuration = data.hasDuration ? (data.durationHours ?? 4) : 4;
  const hasBuiltInAudio = data.builtInAV?.includes("audio");
  const hasBuiltInPJ = data.builtInAV?.includes("projector");
  const hasBuiltInTVs = data.builtInAV?.includes("tvs");
  const hasAnyCoreAVService =
    isStreamingActive || isPAActive || activeVideoTypes.length > 0;

  // ── 1. VIDEO PRODUCTION ──────────────────────────────────────────────────

  if (data.eventType === "studio") {
    const studioDuration = data.studioHasDuration
      ? (data.studioDurationHours ?? 4)
      : 4;

    const isStudioProduction = activeVideoTypes.some((v) =>
      ["podcast", "web-video"].includes(v),
    );

    if (isStudioProduction) {
      // 2.5h setup + 1.5h packup = 4h overhead, plus recording time
      const studioHrs = 4 + studioDuration;
      // PL is billed hourly (actual hours, no day-rate minimum)
      addLaborItem(
        "Production Lead (Studio)",
        "Setup (2.5h) & Packup (1.5h)",
        studioHrs,
        "hrs",
        R.labor.productionLead,
      );
      // Lighting tech is non-PL → day rate minimum
      addLaborItem(
        "Lighting Technician",
        "Studio Lighting Kit Support",
        techHrs(studioHrs),
        "hrs",
        R.labor.lightingTech,
      );
      addItem(
        "Studio Camera Kit",
        "2x Mirrorless Kit + Studio Lighting",
        1,
        "set",
        R.equipment.studioCameraKit,
      );
    }

    if (activeVideoTypes.includes("podcast")) {
      const episodes = Math.max(1, data.podcastEpisodes ?? 1);
      addItem(
        "Podcast Editing",
        `Edit for ${episodes} episode(s)`,
        episodes,
        "unit",
        R.postProduction.podcastEdit,
      );
    }

    if (activeVideoTypes.includes("web-video")) {
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
    if (activeVideoTypes.includes("highlight")) {
      const isHalfDay = (data.highlightDurationHours ?? 0) < 4;
      addItem(
        "Mirrorless Kit (Highlight)",
        isHalfDay ? "Half Day Rate" : "Full Day Rate",
        1,
        "day",
        isHalfDay
          ? R.equipment.mirrorlessHalfDay
          : R.equipment.mirrorlessFullDay,
      );
      // Highlight tech: setup + strike only (no show monitoring). Day rate minimum.
      addLaborItem(
        "Highlight Tech",
        "30m Setup / 30m Packup",
        techHrs(overheadHours(SW.highlight)),
        "hrs",
        R.labor.videoTech,
      );
      addItem(
        "Event Highlight Edit",
        "Creative highlight reel",
        1,
        "edit",
        R.postProduction.highlightEdit,
      );
    }

    if (activeVideoTypes.includes("lecture")) {
      const talkCount = Math.max(1, data.lectureTalksCount ?? 1);
      const editRate = data.lecturePPT
        ? R.postProduction.lectureEditWithPPT
        : R.postProduction.lectureEditNoPPT;

      // overhead = SW.lecture.setup (90min) + SW.lecture.strike (45min) = 2.25h
      const lectureHrs = overheadHours(SW.lecture) + eventDuration;
      addItem(
        "Camcorder & AV Kit",
        "Lecture/Panel Essential Kit",
        1,
        "set",
        R.equipment.camcorderKit,
      );

      // FIX T1-1: First person on a solo job is always a Production Lead (spec image 10)
      // billed hourly. "Video Tech" was the wrong role and the wrong rate ($95 vs $117.99).
      // PL is strictly hourly — no day-rate minimum.
      addProductionLeadItem("1.5h Setup / 45m Packup", lectureHrs);
      addItem(
        "Lecture Editing",
        `${talkCount} talk(s)`,
        talkCount,
        "talk",
        editRate,
      );

      // Additional camera angles — only add camera kit and operator if NOT
      // sharing with an active streaming setup (lectureFromStream flag)
      if (data.additionalAngles && (data.angleCount ?? 0) > 0) {
        const angles = Math.max(1, data.angleCount ?? 1);
        addItem(
          "Additional Camera Kit",
          `${angles} extra angle(s)`,
          angles,
          "set",
          R.equipment.additionalCamKit,
        );
        // Non-PL camera operators → day rate minimum
        addLaborItem(
          "Additional Cam Operator",
          `${angles} op(s)`,
          angles,
          "person",
          R.labor.cameraOperator * techHrs(lectureHrs),
        );
      }
    }
  }

  // ── 2. LIVE STREAMING ────────────────────────────────────────────────────

  if (isStreamingActive) {
    const isBuiltIn = data.cameraSource === "built-in";
    const camCount = parseInt(data.cameraCount || "1") || 1;

    // overhead = SW.streaming.setup (180min) + SW.streaming.strike (90min) = 4.5h
    const streamHrs = overheadHours(SW.streaming) + eventDuration;

    // Streaming tech is non-PL → day rate minimum
    addLaborItem(
      "Streaming Tech",
      "3h Setup / 1.5h Strike",
      techHrs(streamHrs),
      "hrs",
      R.labor.streamingTech,
    );
    addItem(
      "Stream Control Kit",
      "Encoder & Switcher System",
      1,
      "set",
      R.equipment.streamControlKit,
    );

    if (!isBuiltIn) {
      addItem(
        "Camera Kit (Stream)",
        `Camcorder ×${camCount}`,
        camCount,
        "set",
        R.equipment.camcorderKit,
      );
    }

    // FIX (manned vs. unmanned cameras):
    // The spec states there is always at least 1 manned camera, but additional
    // cameras can be unmanned — set up/torn down by the streaming tech, with no
    // dedicated operator needed during the show. When hasUnmannedCameras is true
    // and 2 cameras are selected, only 1 camera operator is billed.
    const billedOperators =
      camCount === 2 && data.hasUnmannedCameras ? 1 : camCount;

    // Camera operator: overheadHours(SW.lecture) = 2.25h setup/strike per camera
    // FIX T2-2: If lectureFromStream is true, lecture shares this camera setup —
    // camera operator is already covering the lecture recording. No duplicate billing.
    // Camera operators are non-PL → day rate minimum.
    const camOpHrs = overheadHours(SW.lecture) + eventDuration;
    const operatorDesc = data.lectureFromStream
      ? `${billedOperators} op(s) @ 2.25h setup/strike (covers lecture recording)`
      : `${billedOperators} op(s) @ 2.25h setup/strike`;
    if (camCount > 1) {
      addLaborItem(
        "Camera Operator",
        operatorDesc,
        billedOperators,
        "person",
        R.labor.cameraOperator * techHrs(camOpHrs),
      );
    }

    if (data.streamGraphics)
      addItem(
        "Stream Graphics Prep",
        "Overlays & Branding",
        1,
        "flat",
        R.streaming.streamGraphicsPrep,
      );
    if (!data.diyStream)
      addItem(
          "Zoom Setup",
          "Destination platform setup and host config",
        1,
        "flat",
        R.streaming.streamLinkSetup,
      );

    addProductionLeadItem("Streaming production lead", eventDuration + 4.5);
  }

  // Required misc kit for onsite productions.
  // Use half-day variant only for short, video-only live recordings.
  if (data.eventType === "live" && hasAnyCoreAVService) {
    const isShortVideoOnlyJob =
      activeVideoTypes.length > 0 &&
      !isStreamingActive &&
      !isPAActive &&
      eventDuration <= 4;
    addItem(
      isShortVideoOnlyJob ? "AV Essential Kit (Half Day)" : "AV Essential Kit",
      "Required accessories for onsite production",
      1,
      "set",
      isShortVideoOnlyJob
        ? R.equipment.avEssentialKitHalfDay
        : R.equipment.avEssentialKit,
    );
  }

  // ── 3. SOCIAL SHORTS ─────────────────────────────────────────────────────

  if (activeShortsCount > 0) {
    addItem(
      "Social Shorts Editing",
      `Vertical cutdowns ×${activeShortsCount}`,
      activeShortsCount,
      "short",
      R.postProduction.socialShortEdit,
    );

    // FIX T3-2: Only skip the mirrorless kit if video production (not streaming)
    // is already active. Streaming uses a camcorder — a mirrorless is still needed
    // for Social Shorts filmed as new material.
    const alreadyFilmingWithMirrorless = activeVideoTypes.length > 0;
    if (data.shortsSource === "filming" && !alreadyFilmingWithMirrorless) {
      addItem(
        "Mirrorless Kit (Shorts Add-on)",
        "Social filming camera kit",
        1,
        "day",
        R.equipment.mirrorlessAddOn,
      );
    }
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
      const micItems: {
        count: number | undefined;
        name: string;
        rate: number;
      }[] = [
        {
          count: data.micWirelessHandheld,
          name: "Wireless Handheld Mic",
          rate: R.mics.wirelessHandheld,
        },
        {
          count: data.micWirelessLav,
          name: "Wireless Lav Mic",
          rate: R.mics.wirelessLav,
        },
        {
          count: data.micWiredSM58,
          name: "Wired SM58 Mic",
          rate: R.mics.wiredSM58,
        },
        {
          count: data.micWiredGooseneck,
          name: "Wired Gooseneck Mic",
          rate: R.mics.wiredGooseneck,
        },
      ];
      for (const { count, name, rate } of micItems) {
        if ((count ?? 0) > 0) {
          addItem(name, `${count} unit(s)`, count ?? 1, "unit", rate);
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

    if (!isStreamingActive && activeVideoTypes.length === 0) {
      addProductionLeadItem(
        "Event A/V production lead",
        eventDuration + (isOutdoor ? 4.5 : 4),
      );
    }
  }

  // ── 5. MORE EVENT AV ─────────────────────────────────────────────────────

  // Projector & Screen — skipped if venue has built-in projector
  if (data.wantsProjector && !hasBuiltInPJ) {
    const screenCount = data.projectorScreenCount ?? 1;
    const is16ft = data.projectorScreenSize === "16ft";
    const screenRate = is16ft
      ? R.equipment.projectorScreen16ft
      : R.equipment.projectorScreen12ft;

    addItem(
      "Projector",
      "Ultra short-throw, 8k brightness",
      1,
      "unit",
      R.equipment.projector,
    );
    addItem(
      "Projection Screen",
      `${data.projectorScreenSize ?? "12ft"}`,
      screenCount,
      "unit",
      screenRate,
    );

    // Screen barn-raise labor (2 techs simultaneously):
    //   12ft: 2h up / 2h down = 4h per tech
    //   16ft: 2.5h up / 2h down = 4.5h per tech  ← FIX: was "2.5h down" (overcalculated 30min)
    //
    // Formula: screenHrsEach = (w.setup - 60 + w.strike) / 60
    //   Subtracts PJ setup (60min) from the serial setup window.
    //   The strike window stores screen-barn-lower only (PJ strike billed separately below).
    //   12ft: (180-60 + 120) / 60 = 4h   |   16ft: (210-60 + 120) / 60 = 4.5h  ✓
    const w = is16ft ? SW.projector16ft : SW.projector12ft;
    const screenHrsEach = (w.setup - 60 + w.strike) / 60;
    // Screen techs are non-PL → day rate minimum
    addLaborItem(
      "Screen Setup & Strike (2 Techs)",
      is16ft
        ? "2 techs × 2.5h up / 2h down (simultaneous)"
        : "2 techs × 2h up / 2h down (simultaneous)",
      2,
      "person",
      R.labor.productionLead * techHrs(screenHrsEach),
    );
    // Projector setup: 1h after screen done + 30min strike = 1.5h flat
    addLaborItem(
      "Projector Setup & Strike",
      "1h setup (after screen) / 30min strike",
      1,
      "flat",
      R.labor.productionLead * techHrs(1.5),
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
  if (data.wantsTVs && !hasBuiltInTVs) {
    const tvCount = data.tvCount ?? 1;
    const tvRate =
      data.tvSize === "85" ? R.equipment.tv85inch : R.equipment.tv75inch;

    addItem(
      `Big Screen TV (${data.tvSize ?? "85"}")`,
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
  if (data.wantsConfidenceMonitors) {
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

  // Lighting
  const lighting = data.lightingServices ?? [];

  if (lighting.includes("stage-wash")) {
    addItem(
      "Stage Wash Kit",
      "2hr setup, 1hr strike",
      1,
      "set",
      R.equipment.stagingWashKit,
    );
    // overhead = SW.stageWash.setup (120min) + SW.stageWash.strike (60min) = 3h
    // Lighting tech is non-PL → day rate minimum
    addLaborItem(
      "Lighting Tech (Stage Wash)",
      "2h setup / 1h strike",
      1,
      "flat",
      R.labor.lightingTech * techHrs(overheadHours(SW.stageWash)),
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
    // overhead per kit = SW.stageUplightsPerKit = 30+15 = 45min = 0.75h
    // Non-PL → day rate minimum (applied once across all kits, not per kit)
    addLaborItem(
      "Lighting Tech (Stage Uplights)",
      `${kits} kit(s) × 30min setup / 15min strike`,
      1,
      "flat",
      R.labor.lightingTech * techHrs(overheadHours(SW.stageUplightsPerKit) * kits),
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
    // Non-PL → day rate minimum
    addLaborItem(
      "Lighting Tech (Wireless Uplights)",
      `${packs} pack(s) × 30min setup / 15min strike`,
      1,
      "flat",
      R.labor.lightingTech * techHrs(overheadHours(SW.wirelessUplightsPerPack) * packs),
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
    // overhead = SW.spotlight.setup (60min) + SW.spotlight.strike (30min) = 1.5h
    // Non-PL → day rate minimum
    addLaborItem(
      "Lighting Tech (Spotlight)",
      "1h setup / 30min strike",
      1,
      "flat",
      R.labor.lightingTech * techHrs(overheadHours(SW.spotlight)),
    );
    needsTrucking = true;
  }

  // Photography
  const photo = data.photographyServices ?? [];
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

  // ── 6. TRUCKING ──────────────────────────────────────────────────────────

  if (needsTrucking) {
    addItem(
      "Trucking",
      "Equipment transport & logistics",
      1,
      "flat",
      R.equipment.trucking,
    );
  }

  // ── 7. HOLIDAY RATE SURCHARGE ────────────────────────────────────────────
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

  // ── 8. RUSH FEE ──────────────────────────────────────────────────────────
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

  // Emory-style PL discount lane from the new pricing templates:
  // - 10% off production lead hourly rows
  // - generally applied to partnered/annual clients or large yearly accounts
  const org = (data.organization ?? "").toLowerCase();
  const qualifiesForPlDiscount =
    productionLeadHourlySubtotal > 0 &&
    (org.includes("emory") || items.reduce((s, i) => s + i.total, 0) >= 10_000);
  if (qualifiesForPlDiscount) {
    const discountRatePerHour = Math.round(R.labor.productionLead * 0.1 * 1000) / 1000;
    addItem(
      "DISCOUNT",
      "Discount - Production Lead (10% off hourly rate) for qualifying clients",
      1,
      "flat",
      round(-productionLeadHourlyHours * discountRatePerHour),
    );
  }

  return { items, shouldRedirect: false };
};
