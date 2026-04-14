import type { LineItem } from "@/lib/calculateSOW";

export function isDiscountLine(i: LineItem): boolean {
  return /^DISCOUNT$/i.test(i.name.trim());
}

export function isRushLine(i: LineItem): boolean {
  return /rush fee/i.test(i.name);
}

/** Equipment rows under white “RECORDING” band in PDF/DOCX financials table. */
export function isRecordingEquipment(item: LineItem): boolean {
  const n = `${item.name} ${item.description}`.toLowerCase();
  if (
    /\b(handheld|lav|gooseneck|sm58|wedge|monitor|voice of god|outdoor audio|indoor audio|audio kit|sound system|wireless mic|wired mic|mic ×|vog)\b/i.test(
      n,
    )
  ) {
    return false;
  }
  return /\b(camcorder|mirrorless|av essential|essential kit|stream kit|encoder|switcher|lighting kit|dvd|tripod|camera kit|hard drive)\b/i.test(
    n,
  );
}

export interface GroupedLineItems {
  laborItems: LineItem[];
  equipItems: LineItem[];
  postItems: LineItem[];
  discountItems: LineItem[];
  miscOtherItems: LineItem[];
  recordingEquipItems: LineItem[];
  nonRecordingEquipItems: LineItem[];
}

/** Same grouping rules as `components/pdf/QuoteDocument.tsx` financials table. */
export function groupLineItems(items: LineItem[]): GroupedLineItems {
  const laborItems = items.filter((i) => {
    if (isDiscountLine(i) || isRushLine(i)) return false;
    return (
      i.unit === "hrs" ||
      i.unit === "flat" ||
      i.description.toLowerCase().includes("tech") ||
      i.name.toLowerCase().includes("tech") ||
      i.name.toLowerCase().includes("lead") ||
      i.name.toLowerCase().includes("operator")
    );
  });
  const equipItems = items.filter(
    (i) =>
      !laborItems.includes(i) &&
      (i.unit === "set" ||
        i.unit === "day" ||
        i.unit === "kit" ||
        i.unit === "pack" ||
        i.unit === "unit" ||
        i.unit === "service"),
  );
  const postItems = items.filter(
    (i) =>
      !laborItems.includes(i) &&
      !equipItems.includes(i) &&
      (i.unit === "edit" ||
        i.unit === "talk" ||
        i.unit === "short" ||
        i.unit === "slot" ||
        i.description.toLowerCase().includes("edit")),
  );
  const otherItems = items.filter(
    (i) =>
      !laborItems.includes(i) &&
      !equipItems.includes(i) &&
      !postItems.includes(i),
  );
  const discountItems = otherItems.filter(isDiscountLine);
  const miscOtherItems = otherItems.filter((i) => !isDiscountLine(i));
  const recordingEquipItems = equipItems.filter(isRecordingEquipment);
  const nonRecordingEquipItems = equipItems.filter((i) => !isRecordingEquipment(i));

  return {
    laborItems,
    equipItems,
    postItems,
    discountItems,
    miscOtherItems,
    recordingEquipItems,
    nonRecordingEquipItems,
  };
}
