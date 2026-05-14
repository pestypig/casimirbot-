import type { GameSemanticLookupReceipt } from "@shared/helix-game-semantic-dictionary";
import { lookupGameSemanticReference } from "./game-semantic-reference";

export function lookupMinecraftBlockItemUtility(input: {
  threadId: string;
  queryRefs: string[];
  now?: string;
}): GameSemanticLookupReceipt {
  return lookupGameSemanticReference({
    threadId: input.threadId,
    gameId: "minecraft",
    queryRefs: input.queryRefs,
    now: input.now,
  }).receipt;
}
