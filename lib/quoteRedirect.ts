import type { QuoteFormData } from "@/schema/quote";
import { QUOTE_LIMITS } from "@/lib/constants";

function activeVideoTypes(data: QuoteFormData): string[] {
  return data.services.includes("video") ? (data.videoTypes ?? []) : [];
}

export function shouldRedirectToSales(data: QuoteFormData): boolean {
  const videoTypes = activeVideoTypes(data);
  const isStreamingActive = data.services.includes("streaming");
  const isPAActive = data.audioServices.includes("pa");

  return (
    data.eventType === "other" ||
    data.venueType === "multiple" ||
    data.locationType === "rented" ||
    data.studioLocationType === "studio-rental" ||
    data.isMultiDay === true ||
    (videoTypes.includes("web-video") &&
      (data.webVideoCount > QUOTE_LIMITS.maxWebVideoCount ||
        data.webVideoDuration > QUOTE_LIMITS.maxWebVideoDurationMins)) ||
    videoTypes.includes("concert") ||
    videoTypes.includes("other") ||
    (isStreamingActive &&
      (data.cameraCount === "2+ (call sales)" ||
        data.cameraCount === "not sure (call sales)")) ||
    (videoTypes.includes("lecture") &&
      data.lectureTalkDuration === "longer (call sales)") ||
    data.audioServices.includes("band") ||
    data.audioServices.includes("recording") ||
    (isPAActive && (data.attendance ?? 0) > QUOTE_LIMITS.maxAttendance)
  );
}
