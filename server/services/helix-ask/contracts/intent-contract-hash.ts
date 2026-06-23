import { sha256Hex } from "../../../utils/information-boundary";
import { stableJsonStringify } from "../../../utils/stable-json";

export const hashHelixAskIntentContract = (contract: unknown): string =>
  sha256Hex(stableJsonStringify(contract));
