import { createHash } from "node:crypto";
import { InformationBoundary, type TInformationBoundary, type TInformationBoundaryMode } from "@shared/information-boundary";
import { stableJsonStringify } from "./stable-json";

export function sha256Hex(input: Buffer | string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function sha256Prefixed(input: Buffer | string): string {
  return `sha256:${sha256Hex(input)}`;
}

export function hashStableJson(value: unknown): string {
  return sha256Prefixed(Buffer.from(stableJsonStringify(value), "utf8"));
}

type BuildInformationBoundaryArgs = {
  data_cutoff_iso: string;
  mode: TInformationBoundaryMode;
  labels_used_as_features: boolean;
  event_features_included?: boolean;
  inputs: unknown;
  features?: unknown;
};

export function buildInformationBoundary(args: BuildInformationBoundaryArgs): TInformationBoundary {
  const boundary: TInformationBoundary = {
    schema_version: "ib/1",
    data_cutoff_iso: args.data_cutoff_iso,
    inputs_hash: hashStableJson(args.inputs),
    features_hash: args.features === undefined ? undefined : hashStableJson(args.features),
    mode: args.mode,
    labels_used_as_features: args.labels_used_as_features,
    event_features_included: args.event_features_included,
  };
  return InformationBoundary.parse(boundary);
}

type BuildInformationBoundaryFromHashesArgs = {
  data_cutoff_iso: string;
  mode: TInformationBoundaryMode;
  labels_used_as_features: boolean;
  event_features_included?: boolean;
  inputs_hash: string;
  features_hash?: string;
};

export function buildInformationBoundaryFromHashes(args: BuildInformationBoundaryFromHashesArgs): TInformationBoundary {
  const boundary: TInformationBoundary = {
    schema_version: "ib/1",
    data_cutoff_iso: args.data_cutoff_iso,
    inputs_hash: args.inputs_hash,
    features_hash: args.features_hash,
    mode: args.mode,
    labels_used_as_features: args.labels_used_as_features,
    event_features_included: args.event_features_included,
  };
  return InformationBoundary.parse(boundary);
}

