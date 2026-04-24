import type { QuoteFormData } from "@/schema/quote";
import { QUOTE_LIMITS } from "@/lib/constants";

export function shouldRedirectToSales(data: QuoteFormData): boolean {
  const isVideoActive = data.services.includes("video");
  const isStreamingActive = data.services.includes("streaming");
  const audio = data.audioServices ?? [];
  const isPAActive = audio.includes("pa");

  // Studio web-video uses legacy videoTypes field
  const studioVideoTypes = isVideoActive ? (data.videoTypes ?? []) : [];

  // Live lecture: check new camera-source fields
  const builtInEditing =
    isVideoActive && (data.videoBuiltInEnabled ?? false)
      ? (data.videoBuiltInEditing ?? [])
      : [];
  const trsEditing =
    isVideoActive && (data.videoTRSEnabled ?? false)
      ? (data.videoTRSEditing ?? [])
      : [];
  const hasLecture =
    builtInEditing.includes("lecture") || trsEditing.includes("lecture");

  return (
    data.eventType === "other" ||
    data.venueType === "multiple" ||
    data.locationType === "rented" ||
    data.studioLocationType === "studio-rental" ||
    data.isMultiDay === true ||
    (studioVideoTypes.includes("web-video") &&
      (data.webVideoCount > QUOTE_LIMITS.maxWebVideoCount ||
        data.webVideoDuration > QUOTE_LIMITS.maxWebVideoDurationMins)) ||
    (isStreamingActive &&
      (data.cameraCount === "2+ (call sales)" ||
        data.cameraCount === "not sure (call sales)")) ||
    (hasLecture && data.lectureTalkDuration === "longer (call sales)") ||
    audio.includes("band") ||
    audio.includes("recording") ||
    (isPAActive && (data.attendance ?? 0) > QUOTE_LIMITS.maxAttendance)
  );
}
