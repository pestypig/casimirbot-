import type {
  GrOsPayload,
  GrOsStage,
  GrOsViabilityStatus,
} from "../../../shared/schema";

export type GrOsPayloadRecord = {
  id: string;
  seq: number;
  ts: string;
  stage: GrOsStage;
  pass: boolean;
  constraints_status?: "PASS" | "FAIL" | "WARN";
  viability_status?: GrOsViabilityStatus;
  certificate_hash?: string | null;
  integrity_ok?: boolean;
  essence_id?: string;
  payload: GrOsPayload;
};

type AppendGrOsPayloadRecord = Omit<GrOsPayloadRecord, "id" | "seq" | "ts"> &
  Partial<Pick<GrOsPayloadRecord, "ts">>;

const parseBufferSize = (): number => {
  const requested = Number(process.env.GR_OS_PAYLOAD_BUFFER_SIZE ?? 200);
  if (!Number.isFinite(requested) || requested < 1) {
    return 200;
  }
  return Math.min(Math.max(25, Math.floor(requested)), 1000);
};

const MAX_BUFFER_SIZE = parseBufferSize();
const records: GrOsPayloadRecord[] = [];
let sequence = 0;

export function recordGrOsPayload(
  input: AppendGrOsPayloadRecord,
): GrOsPayloadRecord {
  const seq = ++sequence;
  const record: GrOsPayloadRecord = {
    id: String(seq),
    seq,
    ts: input.ts ?? new Date().toISOString(),
    stage: input.stage,
    pass: input.pass,
    constraints_status: input.constraints_status,
    viability_status: input.viability_status,
    certificate_hash: input.certificate_hash ?? null,
    integrity_ok: input.integrity_ok,
    essence_id: input.essence_id,
    payload: input.payload,
  };
  records.push(record);
  if (records.length > MAX_BUFFER_SIZE) {
    records.splice(0, records.length - MAX_BUFFER_SIZE);
  }
  return record;
}

export function getGrOsPayloads(limit = 50): GrOsPayloadRecord[] {
  const clamped = Math.min(Math.max(1, Math.floor(limit)), MAX_BUFFER_SIZE);
  if (records.length === 0) return [];
  const start = Math.max(0, records.length - clamped);
  return records.slice(start).reverse();
}

export function getGrOsPayloadById(id: string): GrOsPayloadRecord | null {
  const match = records.find((entry) => entry.id === id);
  return match ?? null;
}

export function __resetGrOsPayloadStore(): void {
  records.length = 0;
  sequence = 0;
}
