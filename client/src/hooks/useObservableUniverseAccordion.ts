import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ObservableUniverseSupportedEtaMode } from "@shared/observable-universe-accordion-projections-constants";
import {
  buildObservableUniverseAccordionRequest,
  fetchObservableUniverseAccordionSurface,
  type ObservableUniverseAccordionProjectRequest,
} from "@/lib/observable-universe-accordion";

export interface UseObservableUniverseAccordionOptions {
  estimateKind?: ObservableUniverseSupportedEtaMode;
  enabled?: boolean;
  refetchMs?: number;
}

export function useObservableUniverseAccordion(
  options: UseObservableUniverseAccordionOptions = {},
) {
  const {
    estimateKind = "proper_time",
    enabled = true,
    refetchMs = 0,
  } = options;

  const request = useMemo<ObservableUniverseAccordionProjectRequest>(
    () => buildObservableUniverseAccordionRequest(estimateKind),
    [estimateKind],
  );

  const refetchInterval =
    Number.isFinite(refetchMs) && refetchMs > 0 ? refetchMs : false;
  const staleTime =
    Number.isFinite(refetchMs) && refetchMs > 0 ? refetchMs : 0;

  return useQuery({
    queryKey: ["observable-universe-accordion", request] as const,
    queryFn: ({ signal }) => fetchObservableUniverseAccordionSurface(request, signal),
    enabled,
    refetchInterval,
    staleTime,
    retry: 1,
  });
}
