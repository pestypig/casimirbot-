import { createHash } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  BucketLocationConstraint,
} from "@aws-sdk/client-s3";
import type { CreateBucketCommandInput, GetObjectCommandOutput } from "@aws-sdk/client-s3";

export type BlobOptions = {
  contentType?: string;
};

export type BlobRecord = {
  uri: string;
  cid: string;
  contentType: string;
  bytes: number;
};

export type BlobRange = {
  start?: number;
  end?: number;
};

type LocatorBackend = "fs" | "s3";

const backend: LocatorBackend = (process.env.STORAGE_BACKEND ?? "fs").toLowerCase() === "s3" ? "s3" : "fs";
const dataDir = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), "data", "essence"));

let s3Client: S3Client | null = null;
let bucketReady = false;
const bucketLocationConstraints = new Set<string>(Object.values(BucketLocationConstraint) as string[]);

type S3Config = {
  bucket: string;
  region: string;
  forcePathStyle: boolean;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

const getS3Config = (): S3Config => {
  const bucket = process.env.S3_BUCKET?.trim() || "essence-artifacts";
  const region = process.env.S3_REGION?.trim() || "us-east-1";
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "1";
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are required when STORAGE_BACKEND=s3");
  }
  return { bucket, region, forcePathStyle, endpoint, accessKeyId, secretAccessKey };
};

const getS3Client = (): S3Client => {
  if (s3Client) {
    return s3Client;
  }
  const cfg = getS3Config();
  s3Client = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: cfg.forcePathStyle,
    credentials: {
      accessKeyId: cfg.accessKeyId!,
      secretAccessKey: cfg.secretAccessKey!,
    },
  });
  return s3Client;
};

const resolveBucketLocationConstraint = (region: string): BucketLocationConstraint => {
  if (!bucketLocationConstraints.has(region)) {
    throw new Error(`Unsupported S3 bucket region: ${region}`);
  }
  return region as BucketLocationConstraint;
};

async function ensureS3Bucket(): Promise<void> {
  if (bucketReady) {
    return;
  }
  const cfg = getS3Config();
  const client = getS3Client();
  try {
    await client.send(new HeadBucketCommand({ Bucket: cfg.bucket }));
  } catch {
    const createInput: CreateBucketCommandInput =
      cfg.region === "us-east-1"
        ? { Bucket: cfg.bucket }
        : {
            Bucket: cfg.bucket,
            CreateBucketConfiguration: {
              LocationConstraint: resolveBucketLocationConstraint(cfg.region),
            },
          };
    await client.send(new CreateBucketCommand(createInput));
  }
  bucketReady = true;
}

const sha256 = (buffer: Buffer): string => createHash("sha256").update(buffer).digest("hex");

const toBuffer = async (input: Buffer | NodeJS.ReadableStream): Promise<Buffer> => {
  if (Buffer.isBuffer(input)) {
    return input;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of input) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const nestedPathFor = (hash: string): string => {
  const prefix = hash.slice(0, 2);
  return path.join(dataDir, prefix, hash);
};

const ensureLocalDir = async (hash: string): Promise<void> => {
  const dir = path.dirname(nestedPathFor(hash));
  await fs.mkdir(dir, { recursive: true });
};

const writeLocalBlob = async (hash: string, buffer: Buffer): Promise<void> => {
  const filePath = nestedPathFor(hash);
  try {
    await fs.access(filePath);
    return;
  } catch {
    await ensureLocalDir(hash);
    await fs.writeFile(filePath, buffer);
  }
};

const readLocalBlob = (hash: string, range?: BlobRange): Readable => {
  const filePath = nestedPathFor(hash);
  if (range && (range.start !== undefined || range.end !== undefined)) {
    const options: { start?: number; end?: number } = {};
    if (typeof range.start === "number") {
      options.start = range.start;
    }
    if (typeof range.end === "number") {
      options.end = range.end;
    }
    return createReadStream(filePath, options);
  }
  return createReadStream(filePath);
};

const buildObjectKey = (hash: string): string => {
  const prefix = hash.slice(0, 2);
  return `essence/${prefix}/${hash}`;
};

type LocatorInfo = { backend: LocatorBackend; hash: string; key: string; bucket?: string };

const resolveLocator = (locator: string): LocatorInfo => {
  if (locator.startsWith("storage://fs/")) {
    const hash = locator.slice("storage://fs/".length);
    return { backend: "fs", hash, key: hash };
  }
  if (locator.startsWith("storage://s3/")) {
    const rest = locator.slice("storage://s3/".length);
    const segments = rest.split("/").filter(Boolean);
    const [maybeBucket, ...keyParts] = segments;
    const hasExplicitBucket = keyParts.length > 0;
    const keySegments = hasExplicitBucket ? keyParts : segments;
    const key = keySegments.join("/");
    const hash = keySegments.at(-1) ?? key;
    return { backend: "s3", hash, key, bucket: hasExplicitBucket ? maybeBucket : undefined };
  }
  if (locator.startsWith("cid:")) {
    const hash = locator.slice(4);
    return { backend, hash, key: backend === "s3" ? buildObjectKey(hash) : hash };
  }
  return { backend, hash: locator, key: backend === "s3" ? buildObjectKey(locator) : locator };
};

const buildRangeHeader = (range?: BlobRange): string | undefined => {
  if (!range) return undefined;
  const { start, end } = range;
  if (typeof start === "number") {
    if (typeof end === "number") {
      return `bytes=${start}-${end}`;
    }
    return `bytes=${start}-`;
  }
  if (typeof end === "number") {
    return `bytes=-${end}`;
  }
  return undefined;
};

export async function putBlob(data: Buffer | NodeJS.ReadableStream, options: BlobOptions = {}): Promise<BlobRecord> {
  const buffer = await toBuffer(data);
  const hash = sha256(buffer);
  const cid = `cid:${hash}`;
  const contentType = options.contentType ?? "application/octet-stream";

  if (backend === "s3") {
    await ensureS3Bucket();
    const cfg = getS3Config();
    const client = getS3Client();
    const key = buildObjectKey(hash);
    await client.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return {
      uri: `storage://s3/${cfg.bucket}/${key}`,
      cid,
      contentType,
      bytes: buffer.length,
    };
  }

  await writeLocalBlob(hash, buffer);
  return {
    uri: `storage://fs/${hash}`,
    cid,
    contentType,
    bytes: buffer.length,
  };
}

export async function getBlob(
  locator: string,
  range?: BlobRange,
): Promise<Readable> {
  const info = resolveLocator(locator);
  if (info.backend === "s3") {
    await ensureS3Bucket();
    const cfg = getS3Config();
    const client = getS3Client();
    const bucket = info.bucket ?? cfg.bucket;
    const rangeHeader = buildRangeHeader(range);
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: info.key,
        ...(rangeHeader ? { Range: rangeHeader } : {}),
      }),
    );
    const body = response.Body;
    if (!body) {
      throw new Error(`Object ${info.key} not found in bucket ${bucket}`);
    }
    return normalizeS3Body(body);
  }

  return readLocalBlob(info.hash, range);
}

type S3Body = GetObjectCommandOutput["Body"];

const isAsyncIterable = (value: unknown): value is AsyncIterable<Uint8Array> =>
  value != null && typeof (value as AsyncIterable<Uint8Array>)[Symbol.asyncIterator] === "function";

const isSdkStreamLike = (
  value: unknown,
): value is {
  transformToByteArray?: () => Promise<Uint8Array>;
} => value != null && typeof (value as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function";

const isUint8Array = (value: unknown): value is Uint8Array => value instanceof Uint8Array;

async function normalizeS3Body(body: S3Body): Promise<Readable> {
  if (body instanceof Readable) {
    return body;
  }
  if (Buffer.isBuffer(body)) {
    return Readable.from(body);
  }
  if (typeof body === "string") {
    return Readable.from(Buffer.from(body));
  }
  if (isUint8Array(body)) {
    return Readable.from(Buffer.from(body));
  }
  if (isSdkStreamLike(body) && body.transformToByteArray) {
    const bytes = await body.transformToByteArray();
    return Readable.from(Buffer.from(bytes));
  }
  if (isAsyncIterable(body)) {
    return Readable.from(body);
  }
  throw new Error("Unsupported S3 body type");
}
