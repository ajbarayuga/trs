import { useFormContext, useWatch } from "react-hook-form";
import { useMemo } from "react";
import { QuoteFormData } from "@/schema/quote";
import { calculateSOW, LineItem } from "@/lib/calculateSOW";

export const useQuoteCalculator = () => {
  const { control } = useFormContext<QuoteFormData>();
  const watchedValues = useWatch({ control }) as QuoteFormData | undefined;

  return useMemo(() => {
    if (watchedValues == null) {
      return { items: [] as LineItem[], subtotal: 0, shouldRedirect: false };
    }
    const { items, shouldRedirect } = calculateSOW(watchedValues);
    const subtotal = items.reduce(
      (sum: number, item: LineItem) => sum + item.total,
      0,
    );
    return { items, subtotal, shouldRedirect: !!shouldRedirect };
  }, [watchedValues]);
};
