import {
  certaintyClassSchema,
  suppressionReasonSchema,
  type CertaintyClass,
  type SuppressionReason,
} from "../../../shared/helix-dottie-callout-contract";

export const OPERATOR_CALLOUT_V1_KIND = "helix.operator_callout.v1" as const;

export type OperatorCalloutV1 = {
  kind: typeof OPERATOR_CALLOUT_V1_KIND;
  deterministic: boolean;
  suppressed: boolean;
  suppression_reason?: SuppressionReason;
  text: {
    certainty: CertaintyClass;
    message: string;
  };
  voice: {
    certainty: CertaintyClass;
    message: string;
  };
};

export type OperatorCalloutV1ValidationError = {
  code:
    | "MISSING_REQUIRED_FIELD"
    | "INVALID_FIELD_TYPE"
    | "INVALID_FIELD_VALUE"
    | "VOICE_CERTAINTY_EXCEEDS_TEXT"
    | "SUPPRESSION_REASON_REQUIRED";
  path: string;
  message: string;
};

export type OperatorCalloutV1ValidationResult =
  | { ok: true; value: OperatorCalloutV1 }
  | { ok: false; errors: OperatorCalloutV1ValidationError[] };

const CERTAINTY_RANK: Record<CertaintyClass, number> = {
  unknown: 0,
  hypothesis: 1,
  reasoned: 2,
  confirmed: 3,
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

export function validateOperatorCalloutV1(payload: unknown): OperatorCalloutV1ValidationResult {
  const errors: OperatorCalloutV1ValidationError[] = [];

  if (!isPlainObject(payload)) {
    return {
      ok: false,
      errors: [
        {
          code: "INVALID_FIELD_TYPE",
          path: "payload",
          message: "payload must be an object",
        },
      ],
    };
  }

  const kind = payload.kind;
  if (kind !== OPERATOR_CALLOUT_V1_KIND) {
    errors.push({
      code: "INVALID_FIELD_VALUE",
      path: "kind",
      message: `kind must be '${OPERATOR_CALLOUT_V1_KIND}'`,
    });
  }

  const deterministic = payload.deterministic;
  if (typeof deterministic !== "boolean") {
    errors.push({
      code: deterministic === undefined ? "MISSING_REQUIRED_FIELD" : "INVALID_FIELD_TYPE",
      path: "deterministic",
      message: "deterministic must be a boolean",
    });
  }

  const suppressed = payload.suppressed;
  if (typeof suppressed !== "boolean") {
    errors.push({
      code: suppressed === undefined ? "MISSING_REQUIRED_FIELD" : "INVALID_FIELD_TYPE",
      path: "suppressed",
      message: "suppressed must be a boolean",
    });
  }

  const text = payload.text;
  if (!isPlainObject(text)) {
    errors.push({
      code: text === undefined ? "MISSING_REQUIRED_FIELD" : "INVALID_FIELD_TYPE",
      path: "text",
      message: "text must be an object",
    });
  }

  const voice = payload.voice;
  if (!isPlainObject(voice)) {
    errors.push({
      code: voice === undefined ? "MISSING_REQUIRED_FIELD" : "INVALID_FIELD_TYPE",
      path: "voice",
      message: "voice must be an object",
    });
  }

  const textCertaintyRaw = isPlainObject(text) ? text.certainty : undefined;
  const textCertaintyParsed = certaintyClassSchema.safeParse(textCertaintyRaw);
  if (!textCertaintyParsed.success) {
    errors.push({
      code: textCertaintyRaw === undefined ? "MISSING_REQUIRED_FIELD" : "INVALID_FIELD_VALUE",
      path: "text.certainty",
      message: "text.certainty must be one of unknown, hypothesis, reasoned, confirmed",
    });
  }

  const voiceCertaintyRaw = isPlainObject(voice) ? voice.certainty : undefined;
  const voiceCertaintyParsed = certaintyClassSchema.safeParse(voiceCertaintyRaw);
  if (!voiceCertaintyParsed.success) {
    errors.push({
      code: voiceCertaintyRaw === undefined ? "MISSING_REQUIRED_FIELD" : "INVALID_FIELD_VALUE",
      path: "voice.certainty",
      message: "voice.certainty must be one of unknown, hypothesis, reasoned, confirmed",
    });
  }

  const textMessage = isPlainObject(text) ? text.message : undefined;
  if (typeof textMessage !== "string" || textMessage.trim().length === 0) {
    errors.push({
      code: textMessage === undefined ? "MISSING_REQUIRED_FIELD" : "INVALID_FIELD_VALUE",
      path: "text.message",
      message: "text.message must be a non-empty string",
    });
  }

  const voiceMessage = isPlainObject(voice) ? voice.message : undefined;
  if (typeof voiceMessage !== "string" || voiceMessage.trim().length === 0) {
    errors.push({
      code: voiceMessage === undefined ? "MISSING_REQUIRED_FIELD" : "INVALID_FIELD_VALUE",
      path: "voice.message",
      message: "voice.message must be a non-empty string",
    });
  }

  const suppressionReason = payload.suppression_reason;
  if (suppressed === true) {
    const suppressionReasonParsed = suppressionReasonSchema.safeParse(suppressionReason);
    if (!suppressionReasonParsed.success) {
      errors.push({
        code: suppressionReason === undefined ? "SUPPRESSION_REASON_REQUIRED" : "INVALID_FIELD_VALUE",
        path: "suppression_reason",
        message: "suppression_reason must be a stable suppression reason when suppressed is true",
      });
    }
  } else if (suppressed === false && suppressionReason !== undefined) {
    errors.push({
      code: "INVALID_FIELD_VALUE",
      path: "suppression_reason",
      message: "suppression_reason must be undefined when suppressed is false",
    });
  }

  if (textCertaintyParsed.success && voiceCertaintyParsed.success) {
    const textRank = CERTAINTY_RANK[textCertaintyParsed.data];
    const voiceRank = CERTAINTY_RANK[voiceCertaintyParsed.data];
    if (voiceRank > textRank) {
      errors.push({
        code: "VOICE_CERTAINTY_EXCEEDS_TEXT",
        path: "voice.certainty",
        message: "voice certainty must not exceed text certainty",
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      kind: OPERATOR_CALLOUT_V1_KIND,
      deterministic: deterministic as boolean,
      suppressed: suppressed as boolean,
      suppression_reason: suppressionReason as SuppressionReason | undefined,
      text: {
        certainty: textCertaintyParsed.data,
        message: textMessage as string,
      },
      voice: {
        certainty: voiceCertaintyParsed.data,
        message: voiceMessage as string,
      },
    },
  };
}
