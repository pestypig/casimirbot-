import { randomUUID } from "node:crypto";
import { EssenceEnvelope } from "@shared/essence-schema";
import {
  TokamakRzEnergyField2D,
  TokamakRzEnergyInput,
  TokamakRzSnapshotInput,
  type TTokamakChannelNormalization,
  type TTokamakChannelKey,
  type TTokamakRzEnergyField2D,
  type TTokamakRzEnergyInput,
  type TTokamakRzSnapshotInput,
} from "@shared/tokamak-energy-field";
import type { TFloat32RasterB64 } from "@shared/essence-physics";
import { SI_UNITS } from "@shared/unit-system";
import { putBlob } from "../../storage";
import { putEnvelope } from "./store";
import { buildInformationBoundaryFromHashes, hashStableJson, sha256Hex, sha256Prefixed } from "../../utils/information-boundary";
import { stableJsonStringify } from "../../utils/stable-json";

type TokamakEnergyBuildOptions = {
  mode?: "observables" | "mixed";
  personaId?: string;
};

const channelKeys: TTokamakChannelKey[] = ["u_deltaB_Jm3", "u_gradp", "u_J", "u_rad"];
const MU0 = 4 * Math.PI * 1e-7;

const decodeFloat32Raster = (b64: string, expectedCount: number, label: string): Float32Array => {
  const clean = (b64 ?? "").trim().replace(/^data:[^,]+,/, "").replace(/\s+/g, "");
  const buf = Buffer.from(clean, "base64");
  const expectedBytes = expectedCount * 4;
  if (buf.byteLength !== expectedBytes) {
    throw new Error(`${label}_size_mismatch: expected ${expectedBytes} bytes, got ${buf.byteLength}`);
  }
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
};

const decodeOptionalRaster = (
  payload: { data_b64: string } | undefined,
  expectedCount: number,
  label: string,
): Float32Array | null => {
  if (!payload) return null;
  return decodeFloat32Raster(payload.data_b64, expectedCount, label);
};

const applyNormalization = (value: number, norm: TTokamakChannelNormalization): number => {
  if (norm.method === "scale_offset") {
    const scale = norm.scale ?? 1;
    const offset = norm.offset ?? 0;
    let v = value * scale + offset;
    if (norm.clamp) {
      v = Math.min(norm.clamp[1], Math.max(norm.clamp[0], v));
    }
    return v;
  }
  return value;
};

const float32ToB64 = (arr: Float32Array): string =>
  Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength).toString("base64");

const buildMaskOn = (mask: Float32Array): Uint8Array => {
  const out = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) {
    out[i] = mask[i] > 0 ? 1 : 0;
  }
  return out;
};

const applyMask = (data: Float32Array, maskOn?: Uint8Array): void => {
  if (!maskOn) return;
  for (let i = 0; i < data.length; i++) {
    if (!maskOn[i]) {
      data[i] = 0;
    }
  }
};

const gradMagnitude2D = (
  field: Float32Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  maskOn?: Uint8Array,
): Float32Array => {
  const out = new Float32Array(field.length);
  if (nx < 1 || ny < 1) return out;
  for (let y = 0; y < ny; y++) {
    const yPrev = y > 0 ? y - 1 : y;
    const yNext = y < ny - 1 ? y + 1 : y;
    const dyDen = yNext === yPrev ? 1 : (yNext - yPrev) * dy;
    for (let x = 0; x < nx; x++) {
      const idx = y * nx + x;
      if (maskOn && !maskOn[idx]) {
        out[idx] = 0;
        continue;
      }
      const xPrev = x > 0 ? x - 1 : x;
      const xNext = x < nx - 1 ? x + 1 : x;
      const dxDen = xNext === xPrev ? 1 : (xNext - xPrev) * dx;
      const gx = (field[y * nx + xNext] - field[y * nx + xPrev]) / dxDen;
      const gy = (field[yNext * nx + x] - field[yPrev * nx + x]) / dyDen;
      out[idx] = Math.hypot(gx, gy);
    }
  }
  return out;
};

const buildRasterPayload = (array: Float32Array): TFloat32RasterB64 => ({
  encoding: "base64",
  dtype: "float32",
  endian: "little",
  order: "row-major",
  data_b64: float32ToB64(array),
});

const assertManifestCoverage = (
  input: TTokamakRzEnergyInput,
  available: Partial<Record<TTokamakChannelKey, Float32Array>>,
): void => {
  for (const entry of input.manifest.channels) {
    if (!available[entry.key]) {
      throw new Error(`tokamak_manifest_missing_channel:${entry.key}`);
    }
  }
  for (const key of channelKeys) {
    if (input.channels[key] && !input.manifest.channels.some((entry) => entry.key === key)) {
      throw new Error(`tokamak_unmanifested_channel:${key}`);
    }
  }
};

const buildChannelHashes = (
  buffers: Partial<Record<TTokamakChannelKey, Buffer>>,
): Record<string, string> => {
  const entries: Record<string, string> = {};
  for (const key of channelKeys) {
    const buf = buffers[key];
    if (buf) {
      entries[key] = sha256Prefixed(buf);
    }
  }
  return entries;
};

export function buildTokamakRzEnergyFromSnapshot(
  rawInput: TTokamakRzSnapshotInput,
  opts?: TokamakEnergyBuildOptions,
): TTokamakRzEnergyField2D {
  const input = TokamakRzSnapshotInput.parse(rawInput);
  const { grid, frame, manifest, device_id, shot_id } = input;
  const nx = grid.nx;
  const ny = grid.ny;
  const expectedCount = nx * ny;

  const mask = decodeFloat32Raster(input.separatrix_mask.data_b64, expectedCount, "separatrix_mask");
  const maskOn = buildMaskOn(mask);

  const deltaB = decodeOptionalRaster(input.perturbations.delta_b_T, expectedCount, "delta_b_T");
  const totalB = decodeOptionalRaster(input.perturbations.b_T, expectedCount, "b_T");
  const eqB = decodeOptionalRaster(input.equilibrium?.b_eq_T, expectedCount, "b_eq_T");
  const pTotal = decodeOptionalRaster(input.perturbations.p_Pa, expectedCount, "p_Pa");
  const pEq = decodeOptionalRaster(input.equilibrium?.p_eq_Pa, expectedCount, "p_eq_Pa");
  const jField = decodeOptionalRaster(input.perturbations.j_A_m2, expectedCount, "j_A_m2");
  const radField = decodeOptionalRaster(input.perturbations.rad_W_m3, expectedCount, "rad_W_m3");

  let deltaBField: Float32Array | null = null;
  if (deltaB) {
    deltaBField = deltaB;
  } else if (totalB && eqB) {
    const diff = new Float32Array(expectedCount);
    for (let i = 0; i < expectedCount; i++) {
      diff[i] = totalB[i] - eqB[i];
    }
    deltaBField = diff;
  }

  const channels: Partial<Record<TTokamakChannelKey, Float32Array>> = {};
  if (deltaBField) {
    const scale = 1 / (2 * MU0);
    const uDeltaB = new Float32Array(expectedCount);
    for (let i = 0; i < expectedCount; i++) {
      const v = deltaBField[i];
      uDeltaB[i] = v * v * scale;
    }
    applyMask(uDeltaB, maskOn);
    channels.u_deltaB_Jm3 = uDeltaB;
  }

  if (pTotal) {
    const pField = new Float32Array(expectedCount);
    if (pEq) {
      for (let i = 0; i < expectedCount; i++) {
        pField[i] = pTotal[i] - pEq[i];
      }
    } else {
      pField.set(pTotal);
    }
    const gradp = gradMagnitude2D(pField, nx, ny, grid.dx_m, grid.dy_m, maskOn);
    channels.u_gradp = gradp;
  }

  if (jField) {
    const uJ = new Float32Array(expectedCount);
    for (let i = 0; i < expectedCount; i++) {
      const v = jField[i];
      uJ[i] = v * v;
    }
    applyMask(uJ, maskOn);
    channels.u_J = uJ;
  }

  if (radField) {
    const uRad = new Float32Array(radField);
    applyMask(uRad, maskOn);
    channels.u_rad = uRad;
  }

  const missing = manifest.channels.filter((entry) => !channels[entry.key]).map((entry) => entry.key);
  if (missing.length > 0) {
    throw new Error(`tokamak_snapshot_missing_channel:${missing.join(",")}`);
  }

  const energyInput: TTokamakRzEnergyInput = {
    schema_version: "tokamak_rz_input/1",
    device_id,
    shot_id,
    timestamp_iso: input.timestamp_iso,
    data_cutoff_iso: input.data_cutoff_iso,
    units: input.units ?? SI_UNITS,
    grid,
    frame,
    separatrix_mask: input.separatrix_mask,
    channels: {
      u_deltaB_Jm3: channels.u_deltaB_Jm3 ? buildRasterPayload(channels.u_deltaB_Jm3) : undefined,
      u_gradp: channels.u_gradp ? buildRasterPayload(channels.u_gradp) : undefined,
      u_J: channels.u_J ? buildRasterPayload(channels.u_J) : undefined,
      u_rad: channels.u_rad ? buildRasterPayload(channels.u_rad) : undefined,
    },
    manifest,
  };

  return buildTokamakRzEnergyField(energyInput, opts);
}

export async function runTokamakEnergyFieldFromSnapshot(
  rawInput: TTokamakRzSnapshotInput,
  opts?: TokamakEnergyBuildOptions,
): Promise<TTokamakRzEnergyField2D> {
  const field = buildTokamakRzEnergyFromSnapshot(rawInput, opts);
  await persistTokamakEnergyEnvelope(field, opts?.personaId);
  return field;
}

export function buildTokamakRzEnergyField(
  rawInput: TTokamakRzEnergyInput,
  opts?: TokamakEnergyBuildOptions,
): TTokamakRzEnergyField2D {
  const input = TokamakRzEnergyInput.parse(rawInput);
  const { grid, frame, manifest, device_id, shot_id } = input;
  const nx = grid.nx;
  const ny = grid.ny;
  const expectedCount = nx * ny;
  const data_cutoff_iso = input.data_cutoff_iso ?? input.timestamp_iso;

  const mask = decodeFloat32Raster(input.separatrix_mask.data_b64, expectedCount, "separatrix_mask");
  const maskBuf = Buffer.from(mask.buffer, mask.byteOffset, mask.byteLength);

  const channelArrays: Partial<Record<TTokamakChannelKey, Float32Array>> = {};
  const channelBuffers: Partial<Record<TTokamakChannelKey, Buffer>> = {};
  for (const key of channelKeys) {
    const payload = input.channels[key];
    if (!payload) continue;
    const arr = decodeFloat32Raster(payload.data_b64, expectedCount, key);
    channelArrays[key] = arr;
    channelBuffers[key] = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  }

  assertManifestCoverage(input, channelArrays);

  const normalizeWeights = manifest.total_policy?.normalize_weights ?? false;
  const weightSum = normalizeWeights
    ? manifest.channels.reduce((sum, entry) => sum + entry.weight, 0)
    : 1;
  const weightScale = normalizeWeights && weightSum !== 0 ? weightSum : 1;

  const uTotal = new Float32Array(expectedCount);
  for (const entry of manifest.channels) {
    const source = channelArrays[entry.key];
    if (!source) continue;
    const weight = entry.weight / weightScale;
    for (let i = 0; i < source.length; i++) {
      const normalized = applyNormalization(source[i], entry.normalization);
      uTotal[i] += weight * normalized;
    }
  }

  const manifest_hash = hashStableJson(manifest);
  const mask_hash = sha256Prefixed(maskBuf);
  const channel_hashes = buildChannelHashes(channelBuffers);
  const inputs_hash = hashStableJson({
    kind: "tokamak_rz_energy/input",
    v: 1,
    device_id,
    shot_id,
    grid,
    frame,
    mask_hash,
    manifest_hash,
    channel_hashes,
  });

  const totalBuf = Buffer.from(uTotal.buffer, uTotal.byteOffset, uTotal.byteLength);
  const features_hash = sha256Prefixed(
    Buffer.concat([Buffer.from(`tokamak-rz-energy:${manifest_hash};grid:${nx}x${ny};`, "utf8"), totalBuf]),
  );
  const information_boundary = buildInformationBoundaryFromHashes({
    data_cutoff_iso,
    mode: opts?.mode ?? "observables",
    labels_used_as_features: false,
    event_features_included: false,
    inputs_hash,
    features_hash,
  });

  return TokamakRzEnergyField2D.parse({
    schema_version: "tokamak_rz_energy_field/1",
    kind: "tokamak_rz_energy_field",
    data_cutoff_iso,
    inputs_hash,
    features_hash,
    information_boundary,
    units: input.units ?? SI_UNITS,
    grid,
    frame,
    timestamp_iso: input.timestamp_iso,
    device_id,
    shot_id,
    separatrix_mask: input.separatrix_mask,
    manifest,
    manifest_hash,
    components: {
      ...input.channels,
      u_total_Jm3: {
        encoding: "base64",
        dtype: "float32",
        endian: "little",
        order: "row-major",
        data_b64: float32ToB64(uTotal),
      },
    },
  });
}

async function persistTokamakEnergyEnvelope(
  field: TTokamakRzEnergyField2D,
  personaId?: string,
): Promise<void> {
  const totalBuf = Buffer.from(field.components.u_total_Jm3.data_b64, "base64");
  const energyHash = sha256Hex(totalBuf);
  const energyBlob = await putBlob(totalBuf, { contentType: "application/octet-stream" });

  const maskBuf = Buffer.from(field.separatrix_mask.data_b64, "base64");
  const maskBlob = await putBlob(maskBuf, { contentType: "application/octet-stream" });

  const manifestJson = stableJsonStringify(field.manifest);
  const manifestBuf = Buffer.from(manifestJson, "utf8");
  const manifestBlob = await putBlob(manifestBuf, { contentType: "application/json" });

  const now = new Date().toISOString();
  const envelope = EssenceEnvelope.parse({
    header: {
      id: randomUUID(),
      version: "essence/1.0",
      modality: "multimodal",
      created_at: now,
      source: {
        uri: "compute://tokamak-energy-field",
        original_hash: { algo: "sha256", value: energyHash },
        creator_id: personaId ?? "persona:tokamak-energy",
        cid: energyBlob.cid,
        license: "CC-BY-4.0",
      },
      rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
      acl: { visibility: "public", groups: [] },
    },
    features: {
      physics: {
        kind: "tokamak-energy-field",
        summary: {
          device_id: field.device_id ?? null,
          shot_id: field.shot_id ?? null,
          manifest_hash: field.manifest_hash,
          channel_count: field.manifest.channels.length,
        },
        artifacts: {
          energy_field_url: energyBlob.uri,
          energy_field_cid: energyBlob.cid,
          mask_url: maskBlob.uri,
          mask_cid: maskBlob.cid,
          manifest_url: manifestBlob.uri,
          manifest_cid: manifestBlob.cid,
        },
      },
    },
    embeddings: [],
    provenance: {
      pipeline: [
        {
          name: "tokamak-energy-field",
          impl_version: "1.0.0",
          lib_hash: { algo: "sha256", value: sha256Hex(Buffer.from("tokamak-energy-field@1", "utf8")) },
          params: {
            device_id: field.device_id ?? null,
            shot_id: field.shot_id ?? null,
            channel_count: field.manifest.channels.length,
            manifest_hash: field.manifest_hash,
          },
          input_hash: { algo: "sha256", value: field.inputs_hash.replace(/^sha256:/, "") },
          output_hash: { algo: "sha256", value: energyHash },
          started_at: field.data_cutoff_iso,
          ended_at: field.data_cutoff_iso,
        },
      ],
      merkle_root: { algo: "sha256", value: energyHash },
      previous: null,
      signatures: [],
      information_boundary: field.information_boundary,
    },
  });
  await putEnvelope(envelope);
}

export async function runTokamakEnergyField(
  rawInput: TTokamakRzEnergyInput,
  opts?: TokamakEnergyBuildOptions,
): Promise<TTokamakRzEnergyField2D> {
  const field = buildTokamakRzEnergyField(rawInput, opts);
  await persistTokamakEnergyEnvelope(field, opts?.personaId);
  return field;
}
