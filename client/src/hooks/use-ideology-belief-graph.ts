import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type {
  IdeologyBeliefGraphConfig,
  IdeologyBeliefGraphResponse,
} from "@/lib/ideology-types";

export type IdeologyBeliefGraphRequest = Partial<
  Pick<
    IdeologyBeliefGraphConfig,
    | "rootFixed"
    | "includeSeeAlso"
    | "seeAlsoWeight"
    | "edgeMode"
    | "stepSize"
    | "maxIterations"
    | "thresholds"
    | "scoreClamp"
    | "trueIds"
    | "falseIds"
  > & {
    includeGraph: boolean;
    includeAttempts: boolean;
  }
>;

export function useIdeologyBeliefGraph(request: IdeologyBeliefGraphRequest = {}) {
  return useQuery({
    queryKey: ["/api/ethos/ideology/belief-graph", request],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/ethos/ideology/belief-graph", request);
      return (await res.json()) as IdeologyBeliefGraphResponse;
    },
    staleTime: 60_000,
  });
}
