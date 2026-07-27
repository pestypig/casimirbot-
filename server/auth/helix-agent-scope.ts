import { HelixAgentApiServiceError } from "../services/helix-agent-api/errors";
import type { HelixAgentApiPrincipal } from "../services/helix-agent-api/types";

export const requireHelixAgentApiScope = (
  principal: HelixAgentApiPrincipal,
  scope: string,
): void => {
  if (principal.scopes.has(scope)) return;
  throw new HelixAgentApiServiceError(
    403,
    "insufficient_scope",
    `The bearer token is missing the required ${scope} scope.`,
    false,
    { required_scope: scope },
  );
};
