import { useFormContext } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { QuoteFormData } from "@/schema/quote";
import { calculateSOW, LineItem } from "@/lib/calculateSOW";
import { useMemo } from "react";

export const useQuoteCalculator = () => {
  const { control, getValues } = useFormContext<QuoteFormData>();
  const watchedValues = useWatch({ control }) as QuoteFormData | undefined;

  return useMemo(() => {
    const snapshot = watchedValues ?? getValues();
    const { items, shouldRedirect } = calculateSOW(snapshot);
    const subtotal = items.reduce(
      (sum: number, item: LineItem) => sum + item.total,
      0,
    );
    return { items, subtotal, shouldRedirect };
  }, [watchedValues, getValues]);
};
