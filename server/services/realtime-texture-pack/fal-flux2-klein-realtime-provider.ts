import crypto from "node:crypto";
import sharp from "sharp";
import {
  REALTIME_TEXTURE_PACK_BASELINE_HEIGHT,
  REALTIME_TEXTURE_PACK_BASELINE_WIDTH,
  REALTIME_TEXTURE_PACK_MAX_FRAME_DATA_URL_BYTES,
  REALTIME_TEXTURE_PACK_PROJECTION_FRAME_SCHEMA,
  parseRealtimeTexturePackProjectionFrame,
  parseRealtimeTexturePackTransformRequest,
  type RealtimeTexturePackProjectionFrameV1,
  type RealtimeTexturePackProviderV1,
  type RealtimeTexturePackTransformRequestV1,
} from "@shared/realtime-texture-pack";

export const FAL_FLUX2_KLEIN_REALTIME_PROVIDER_ID =
  "fal_flux2_klein_realtime" as const;
export const FAL_FLUX2_KLEIN_REALTIME_MODEL =
  "fal-ai/flux-2/klein/realtime" as const;
export const FAL_FLUX2_KLEIN_INPUT_SIZE = 704 as const;
export const FAL_FLUX2_KLEIN_OUTPUT_SIZES = [768, 1024] as const;

export type FalFlux2KleinRealtimeTransportInput = {
  image_url: string;
  prompt: string;
  seed: 35;
  num_inference_steps: 3;
  image_size: "square";
  enable_interpolation: false;
  output_feedback_strength: 1;
};

export type FalFlux2KleinRealtimeTransportResult = {
  images: Array<{
    content: Uint8Array | string;
    content_type?: string | null;
    width: number;
    height: number;
  }>;
  seed?: number;
  provider_request_id?: string | null;
};

export type FalFlux2KleinRealtimeTransport = {
  transform(
    input: FalFlux2KleinRealtimeTransportInput,
  ): Promise<FalFlux2KleinRealtimeTransportResult>;
  close?(): Promise<void> | void;
};

export type FalFlux2KleinRealtimeTrace = {
  schema: "casimir.realtime_texture_pack.fal_transform_trace.v1";
  request_id: string;
  session_id: string;
  source_frame_id: string;
  projection_frame_id: string | null;
  provider_request_id: string | null;
  status: "completed" | "failed";
  failure_code: string | null;
  input_width: 704;
  input_height: 704;
  input_bytes: number;
  provider_output_width: number | null;
  provider_output_height: number | null;
  provider_output_bytes: number | null;
  projection_width: 512;
  projection_height: 288;
  elapsed_ms: number;
  prompt_included: false;
  pixels_included: false;
  credential_included: false;
  authoritative: false;
};

export type FalFlux2KleinRealtimeProvider = RealtimeTexturePackProviderV1 & {
  close(): Promise<void>;
};

const parseJpegDataUrl = (value: string): Buffer => {
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/u.exec(value);
  if (!match) throw new Error("fal_realtime_input_jpeg_required");
  const bytes = Buffer.from(match[1], "base64");
  if (bytes.length === 0) throw new Error("fal_realtime_input_empty");
  return bytes;
};

const parseRawJpeg = (content: Uint8Array | string): Buffer => {
  if (content instanceof Uint8Array) return Buffer.from(content);
  if (typeof content !== "string" || !/^[A-Za-z0-9+/=]+$/u.test(content)) {
    throw new Error("fal_realtime_output_content_invalid");
  }
  const bytes = Buffer.from(content, "base64");
  if (bytes.length === 0) throw new Error("fal_realtime_output_empty");
  return bytes;
};

const boundedElapsed = (startedAt: number, now: () => number): number =>
  Math.max(0, Math.min(3_600_000, Math.round(now() - startedAt)));

export const createFalFlux2KleinRealtimeProvider = (input: {
  transport: FalFlux2KleinRealtimeTransport;
  now?: () => number;
  completedAt?: () => string;
  onTrace?: (trace: FalFlux2KleinRealtimeTrace) => void;
}): FalFlux2KleinRealtimeProvider => {
  const now = input.now ?? (() => Date.now());
  const completedAt = input.completedAt ?? (() => new Date().toISOString());

  const transform = async (
    request: RealtimeTexturePackTransformRequestV1,
  ): Promise<RealtimeTexturePackProjectionFrameV1> => {
    parseRealtimeTexturePackTransformRequest(request);
    const startedAt = now();
    let inputBytes = 0;
    let outputBytes: number | null = null;
    let outputWidth: number | null = null;
    let outputHeight: number | null = null;
    let providerRequestId: string | null = null;
    let projectionFrameId: string | null = null;
    try {
      const source = parseJpegDataUrl(request.source_image_data_url);
      const letterboxed = await sharp(source, { failOn: "error" })
        .rotate()
        .resize(FAL_FLUX2_KLEIN_INPUT_SIZE, FAL_FLUX2_KLEIN_INPUT_SIZE, {
          fit: "contain",
          position: "centre",
          background: { r: 0, g: 0, b: 0, alpha: 1 },
          withoutEnlargement: false,
        })
        .jpeg({ quality: 50, chromaSubsampling: "4:2:0" })
        .toBuffer();
      inputBytes = letterboxed.length;

      const result = await input.transport.transform({
        image_url: `data:image/jpeg;base64,${letterboxed.toString("base64")}`,
        prompt: request.prompt,
        seed: 35,
        num_inference_steps: 3,
        image_size: "square",
        enable_interpolation: false,
        output_feedback_strength: 1,
      });
      providerRequestId = typeof result.provider_request_id === "string"
        ? result.provider_request_id.slice(0, 200)
        : null;
      if (result.images.length !== 1) {
        throw new Error("fal_realtime_single_output_required");
      }
      const image = result.images[0];
      const contentType = image.content_type?.toLowerCase() ?? "image/jpeg";
      if (contentType !== "image/jpeg") {
        throw new Error("fal_realtime_output_jpeg_required");
      }
      if (
        image.width !== image.height ||
        !(FAL_FLUX2_KLEIN_OUTPUT_SIZES as readonly number[]).includes(image.width)
      ) {
        throw new Error("fal_realtime_output_dimensions_unsupported");
      }
      outputWidth = image.width;
      outputHeight = image.height;
      const rawOutput = parseRawJpeg(image.content);
      outputBytes = rawOutput.length;
      if (rawOutput.length * 4 / 3 > REALTIME_TEXTURE_PACK_MAX_FRAME_DATA_URL_BYTES) {
        throw new Error("fal_realtime_output_too_large");
      }
      const metadata = await sharp(rawOutput, { failOn: "error" }).metadata();
      if (metadata.format !== "jpeg" || metadata.width !== image.width || metadata.height !== image.height) {
        throw new Error("fal_realtime_output_metadata_mismatch");
      }
      const cropHeight = Math.round(image.width * 9 / 16);
      const projection = await sharp(rawOutput, { failOn: "error" })
        .extract({
          left: 0,
          top: Math.max(0, Math.floor((image.height - cropHeight) / 2)),
          width: image.width,
          height: cropHeight,
        })
        .resize(REALTIME_TEXTURE_PACK_BASELINE_WIDTH, REALTIME_TEXTURE_PACK_BASELINE_HEIGHT, {
          fit: "fill",
        })
        .jpeg({ quality: 72, chromaSubsampling: "4:2:0" })
        .toBuffer();
      const projectionDataUrl = `data:image/jpeg;base64,${projection.toString("base64")}`;
      if (projectionDataUrl.length > REALTIME_TEXTURE_PACK_MAX_FRAME_DATA_URL_BYTES) {
        throw new Error("fal_realtime_projection_too_large");
      }
      projectionFrameId = `projection:fal:${crypto.randomUUID()}`;
      const frame = parseRealtimeTexturePackProjectionFrame({
        schema: REALTIME_TEXTURE_PACK_PROJECTION_FRAME_SCHEMA,
        projection_frame_id: projectionFrameId,
        request_id: request.request_id,
        session_id: request.session_id,
        source_frame_id: request.source_frame_id,
        source_captured_at: request.source_captured_at,
        projection_completed_at: completedAt(),
        projection_image_data_url: projectionDataUrl,
        provider_id: FAL_FLUX2_KLEIN_REALTIME_PROVIDER_ID,
        provider_model: FAL_FLUX2_KLEIN_REALTIME_MODEL,
        authoritative: false,
        authority_class: "non_authoritative_projection",
        interpolated: false,
      });
      input.onTrace?.({
        schema: "casimir.realtime_texture_pack.fal_transform_trace.v1",
        request_id: request.request_id,
        session_id: request.session_id,
        source_frame_id: request.source_frame_id,
        projection_frame_id: projectionFrameId,
        provider_request_id: providerRequestId,
        status: "completed",
        failure_code: null,
        input_width: 704,
        input_height: 704,
        input_bytes: inputBytes,
        provider_output_width: outputWidth,
        provider_output_height: outputHeight,
        provider_output_bytes: outputBytes,
        projection_width: 512,
        projection_height: 288,
        elapsed_ms: boundedElapsed(startedAt, now),
        prompt_included: false,
        pixels_included: false,
        credential_included: false,
        authoritative: false,
      });
      return frame;
    } catch (error) {
      const failureCode = error instanceof Error ? error.message : "fal_realtime_transform_failed";
      input.onTrace?.({
        schema: "casimir.realtime_texture_pack.fal_transform_trace.v1",
        request_id: request.request_id,
        session_id: request.session_id,
        source_frame_id: request.source_frame_id,
        projection_frame_id: null,
        provider_request_id: providerRequestId,
        status: "failed",
        failure_code: failureCode.slice(0, 160),
        input_width: 704,
        input_height: 704,
        input_bytes: inputBytes,
        provider_output_width: outputWidth,
        provider_output_height: outputHeight,
        provider_output_bytes: outputBytes,
        projection_width: 512,
        projection_height: 288,
        elapsed_ms: boundedElapsed(startedAt, now),
        prompt_included: false,
        pixels_included: false,
        credential_included: false,
        authoritative: false,
      });
      throw error;
    }
  };

  return {
    provider_id: FAL_FLUX2_KLEIN_REALTIME_PROVIDER_ID,
    transform,
    close: async () => { await input.transport.close?.(); },
  };
};

