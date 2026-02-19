import { describe, expect, it } from "vitest";

import { __test } from "../scripts/helical-phase6-ab";

describe("helical phase6 harness scoreability classification", () => {
  it("marks payload scoreable only when required semantic fields exist", () => {
    const payload = {
      text: "answer",
      debug: {
        semantic_quality: {
          claim_citation_link_rate: 0.8,
          unsupported_claim_rate: 0.1,
          contradiction_flag: false,
          fail_reasons: [],
        },
      },
    };

    expect(__test.classifyScoreability(payload)).toEqual({
      scoreable: true,
      failClass: null,
      failReason: null,
    });
  });

  it("classifies missing semantic metrics as metric_input_missing", () => {
    const payload = {
      text: "answer",
      debug: {
        semantic_quality: {
          claim_citation_link_rate: 0.2,
          fail_reasons: [],
        },
      },
    };

    expect(__test.classifyScoreability(payload as never)).toEqual({
      scoreable: false,
      failClass: "metric_input_missing",
      failReason: "required_metric_inputs_missing",
    });
  });

  it("classifies malformed metric types as schema_mismatch", () => {
    const payload = {
      text: "answer",
      debug: {
        semantic_quality: {
          claim_citation_link_rate: "bad",
          unsupported_claim_rate: 0.2,
          contradiction_flag: false,
          fail_reasons: [],
        },
      },
    };

    expect(__test.classifyScoreability(payload as never)).toEqual({
      scoreable: false,
      failClass: "schema_mismatch",
      failReason: "semantic_metric_type_mismatch",
    });
  });

  it("does not allow unknown fail_class values", () => {
    expect(__test.classifyScoreability({ fail_class: "weird_failure", fail_reason: "x" } as never)).toEqual({
      scoreable: false,
      failClass: "schema_mismatch",
      failReason: "unknown_fail_class",
    });
  });

  it("uses explicit classifications for parse/http/non-http outcomes", () => {
    expect(__test.metricFromPayload(0, { fail_class: "timeout_soft", fail_reason: "aborted" })).toMatchObject({
      scoreable: false,
      pass: false,
      fail_class: "timeout_soft",
      fail_reason: "aborted",
    });

    expect(__test.metricFromPayload(0, { fail_class: "timeout_hard", fail_reason: "hard_timeout" })).toMatchObject({
      scoreable: false,
      pass: false,
      fail_class: "timeout_hard",
      fail_reason: "hard_timeout",
    });

    expect(__test.metricFromPayload(0, null)).toMatchObject({
      scoreable: false,
      pass: false,
      fail_class: "schema_mismatch",
      fail_reason: "response_payload_not_object",
    });

    expect(__test.metricFromPayload(200, { fail_class: "invalid_json", fail_reason: "Unexpected token" })).toMatchObject({
      scoreable: false,
      pass: false,
      fail_class: "invalid_json",
      fail_reason: "Unexpected token",
    });

    expect(__test.metricFromPayload(503, null)).toMatchObject({
      scoreable: false,
      pass: false,
      fail_class: "http_error",
      fail_reason: "http_status_503",
    });
  });
});
