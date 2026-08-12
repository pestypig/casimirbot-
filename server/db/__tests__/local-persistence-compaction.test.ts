import { describe, expect, it } from "vitest";
import { compactLocalEnvironmentSituationDigestRows } from
  "../local-persistence-compaction";

const digest = (input: {
  id: number;
  binding?: string;
  plane?: string;
  subject?: string;
  epoch?: string;
}) => ({
  digest_id: `digest:${input.id}`,
  environment_binding_id: input.binding ?? "binding:a",
  producer_plane: input.plane ?? "player_embodiment",
  subject_ref: input.subject ?? "subject:a",
  producer_epoch_ref: input.epoch ?? "epoch:a",
  observed_at: new Date(Date.UTC(2026, 0, 1, 0, 0, input.id)).toISOString(),
});

describe("local persistence telemetry compaction", () => {
  it("keeps only the newest derived digests per bound subject across producer epochs", () => {
    const rows = Array.from({ length: 10 }, (_, id) =>
      digest({ id, epoch: id < 5 ? "epoch:old" : "epoch:new" }),
    );

    const compacted = compactLocalEnvironmentSituationDigestRows(rows, 4);

    expect(compacted.map((row) => row.digest_id)).toEqual([
      "digest:9",
      "digest:8",
      "digest:7",
      "digest:6",
    ]);
  });

  it("preserves an independent recent window for each binding, plane, and subject", () => {
    const rows = [
      digest({ id: 1 }),
      digest({ id: 2 }),
      digest({ id: 3, binding: "binding:b" }),
      digest({ id: 4, plane: "world_authority" }),
      digest({ id: 5, subject: "subject:b" }),
    ];

    const compacted = compactLocalEnvironmentSituationDigestRows(rows, 1);

    expect(compacted.map((row) => row.digest_id).sort()).toEqual([
      "digest:2",
      "digest:3",
      "digest:4",
      "digest:5",
    ]);
  });
});
