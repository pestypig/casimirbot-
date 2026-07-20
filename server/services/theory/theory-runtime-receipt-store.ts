import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  isTheoryRuntimeReceiptV1,
  type TheoryRuntimeReceiptV1,
} from "../../../shared/contracts/theory-runtime-receipt.v1";

export const THEORY_RUNTIME_RECEIPT_STORE_ROOT =
  "artifacts/research/theory-runtime-receipts" as const;

export type TheoryRuntimePersistedReceiptRefV1 = {
  artifactId: "theory_runtime_persisted_receipt";
  schemaVersion: "theory_runtime_persisted_receipt/v1";
  requestId: string;
  receiptId: string;
  path: string;
  sha256: string;
  sizeBytes: number;
  writtenAt: string;
};

const normalizeRepoPath = (value: string): string => value.replace(/\\/g, "/");

const isInside = (root: string, candidate: string): boolean => {
  const relative = path.relative(root, candidate);
  return (
    relative.length === 0 ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
};

const requireReceiptIdentity = (label: string, value: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  const trimmed = value.trim();
  if (trimmed === "." || trimmed === "..") {
    throw new Error(`${label} must not be a dot path component.`);
  }
  return value;
};

const receiptFileName = (input: {
  runtimeId: string;
  requestId: string;
  receiptId: string;
}): string => {
  const identity = [
    requireReceiptIdentity("runtimeId", input.runtimeId),
    requireReceiptIdentity("requestId", input.requestId),
    requireReceiptIdentity("receiptId", input.receiptId),
  ];
  const digest = createHash("sha256")
    .update(JSON.stringify(identity), "utf8")
    .digest("base64url");
  return `receipt-${digest}.v1.json`;
};

const isAlreadyExists = (error: unknown): boolean =>
  (error as NodeJS.ErrnoException).code === "EEXIST";

const immutableReceiptError = (absolutePath: string): Error =>
  new Error(
    `Theory runtime receipt artifact already exists and is immutable: ${absolutePath}`,
  );

function receiptArtifactPath(input: {
  projectRoot: string;
  runtimeId: string;
  requestId: string;
  receiptId: string;
}): string {
  return path.resolve(
    input.projectRoot,
    THEORY_RUNTIME_RECEIPT_STORE_ROOT,
    receiptFileName(input),
  );
}

async function assertProjectRoot(projectRoot: string): Promise<string> {
  const rootStat = await fs.lstat(projectRoot);
  if (rootStat.isSymbolicLink()) {
    throw new Error(
      "Theory runtime receipt project root must not be a symbolic link.",
    );
  }
  if (!rootStat.isDirectory()) {
    throw new Error("Theory runtime receipt project root must be a directory.");
  }
  return fs.realpath(projectRoot);
}

async function ensureAndValidateDirectoryChain(input: {
  projectRoot: string;
  realProjectRoot: string;
  relativeDirectory: string;
  createMissing: boolean;
}): Promise<{ directory: string; realDirectory: string }> {
  const components = input.relativeDirectory
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);
  if (
    components.length === 0 ||
    components.some((component) => component === "." || component === "..")
  ) {
    throw new Error(
      "Theory runtime receipt store path is not a safe directory chain.",
    );
  }

  let directory = input.projectRoot;
  let realDirectory = input.realProjectRoot;
  for (const component of components) {
    directory = path.join(directory, component);
    if (input.createMissing) {
      try {
        await fs.mkdir(directory);
      } catch (error) {
        if (!isAlreadyExists(error)) throw error;
      }
    }
    const stat = await fs.lstat(directory);
    if (stat.isSymbolicLink()) {
      throw new Error(
        `Theory runtime receipt directory must not be a symbolic link: ${directory}`,
      );
    }
    if (!stat.isDirectory()) {
      throw new Error(
        `Theory runtime receipt ancestor must be a directory: ${directory}`,
      );
    }
    realDirectory = await fs.realpath(directory);
    if (
      realDirectory === input.realProjectRoot ||
      !isInside(input.realProjectRoot, realDirectory)
    ) {
      throw new Error(
        `Theory runtime receipt directory escaped the real project root: ${directory}`,
      );
    }
  }
  return { directory, realDirectory };
}

export async function writeTheoryRuntimeReceiptArtifact(input: {
  projectRoot: string;
  requestId: string;
  receipt: TheoryRuntimeReceiptV1;
  /** @deprecated Persistence time is assigned by the receipt store. */
  writtenAt?: string;
}): Promise<TheoryRuntimePersistedReceiptRefV1> {
  if (!isTheoryRuntimeReceiptV1(input.receipt)) {
    throw new Error(
      "Theory runtime receipt failed its v1 contract guard before immutable persistence.",
    );
  }
  const projectRoot = path.resolve(input.projectRoot);
  const storeRoot = path.resolve(
    projectRoot,
    THEORY_RUNTIME_RECEIPT_STORE_ROOT,
  );
  if (!isInside(projectRoot, storeRoot) || storeRoot === projectRoot) {
    throw new Error(
      "Theory runtime receipt store must resolve inside the project root.",
    );
  }

  const realProjectRoot = await assertProjectRoot(projectRoot);
  const createdStore = await ensureAndValidateDirectoryChain({
    projectRoot,
    realProjectRoot,
    relativeDirectory: THEORY_RUNTIME_RECEIPT_STORE_ROOT,
    createMissing: true,
  });
  if (path.resolve(createdStore.directory) !== storeRoot) {
    throw new Error(
      "Theory runtime receipt store resolved to an unexpected path.",
    );
  }
  const validatedStore = await ensureAndValidateDirectoryChain({
    projectRoot,
    realProjectRoot,
    relativeDirectory: THEORY_RUNTIME_RECEIPT_STORE_ROOT,
    createMissing: false,
  });
  if (validatedStore.realDirectory !== createdStore.realDirectory) {
    throw new Error("Theory runtime receipt store changed during validation.");
  }

  const absolutePath = receiptArtifactPath({
    projectRoot,
    runtimeId: input.receipt.runtimeId,
    requestId: input.requestId,
    receiptId: input.receipt.receiptId,
  });
  if (!isInside(storeRoot, absolutePath)) {
    throw new Error("Theory runtime receipt path escaped the receipt store.");
  }

  try {
    await fs.lstat(absolutePath);
    throw immutableReceiptError(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const payload = Buffer.from(
    `${JSON.stringify(input.receipt, null, 2)}\n`,
    "utf8",
  );
  const temporaryPath = `${absolutePath}.${process.pid}.${randomUUID()}.create.tmp`;
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  let created = false;
  try {
    handle = await fs.open(temporaryPath, "wx", 0o600);

    const openedRealPath = await fs.realpath(temporaryPath);
    if (!isInside(realProjectRoot, openedRealPath)) {
      throw new Error(
        "Theory runtime receipt temporary file escaped the real project root.",
      );
    }
    const openedStat = await handle.stat();
    if (!openedStat.isFile()) {
      throw new Error(
        "Theory runtime receipt temporary target must be a regular file.",
      );
    }
    await handle.writeFile(payload);
    await handle.sync();
    const persistedStat = await handle.stat();
    if (!persistedStat.isFile() || persistedStat.size !== payload.byteLength) {
      throw new Error("Theory runtime receipt persistence was incomplete.");
    }
    await handle.close();
    handle = null;

    try {
      // Publish only fully written bytes. A hard link is an atomic
      // create-if-absent operation and cannot replace an existing receipt.
      await fs.link(temporaryPath, absolutePath);
      created = true;
    } catch (error) {
      if (isAlreadyExists(error)) throw immutableReceiptError(absolutePath);
      throw error;
    }

    const finalStore = await ensureAndValidateDirectoryChain({
      projectRoot,
      realProjectRoot,
      relativeDirectory: THEORY_RUNTIME_RECEIPT_STORE_ROOT,
      createMissing: false,
    });
    if (finalStore.realDirectory !== validatedStore.realDirectory) {
      throw new Error(
        "Theory runtime receipt store changed during persistence.",
      );
    }
    const finalStat = await fs.lstat(absolutePath);
    if (finalStat.isSymbolicLink() || !finalStat.isFile()) {
      throw new Error(
        "Theory runtime persisted receipt must be a regular file.",
      );
    }
    const finalRealPath = await fs.realpath(absolutePath);
    if (!isInside(realProjectRoot, finalRealPath)) {
      throw new Error(
        "Theory runtime persisted receipt escaped the real project root.",
      );
    }
    const persistedPayload = await fs.readFile(absolutePath);
    if (!persistedPayload.equals(payload)) {
      throw new Error(
        "Theory runtime persisted receipt bytes differ from the atomically published payload.",
      );
    }

    return {
      artifactId: "theory_runtime_persisted_receipt",
      schemaVersion: "theory_runtime_persisted_receipt/v1",
      requestId: input.requestId,
      receiptId: input.receipt.receiptId,
      path: normalizeRepoPath(path.relative(projectRoot, absolutePath)),
      sha256: createHash("sha256").update(payload).digest("hex"),
      sizeBytes: payload.byteLength,
      writtenAt: new Date().toISOString(),
    };
  } catch (error) {
    if (handle != null) await handle.close().catch(() => undefined);
    if (created) await fs.unlink(absolutePath).catch(() => undefined);
    throw error;
  } finally {
    await fs.unlink(temporaryPath).catch(() => undefined);
  }
}

export async function readTheoryRuntimeReceiptArtifact(input: {
  projectRoot: string;
  runtimeId: string;
  requestId: string;
  receiptId: string;
}): Promise<{
  receipt: TheoryRuntimeReceiptV1;
  artifact: TheoryRuntimePersistedReceiptRefV1;
} | null> {
  const projectRoot = path.resolve(input.projectRoot);
  const absolutePath = receiptArtifactPath({ ...input, projectRoot });
  const storeRoot = path.resolve(
    projectRoot,
    THEORY_RUNTIME_RECEIPT_STORE_ROOT,
  );
  if (!isInside(projectRoot, storeRoot) || !isInside(storeRoot, absolutePath)) {
    throw new Error("Theory runtime receipt read path escaped its store.");
  }

  let validatedStore: Awaited<
    ReturnType<typeof ensureAndValidateDirectoryChain>
  >;
  try {
    const realProjectRoot = await assertProjectRoot(projectRoot);
    validatedStore = await ensureAndValidateDirectoryChain({
      projectRoot,
      realProjectRoot,
      relativeDirectory: THEORY_RUNTIME_RECEIPT_STORE_ROOT,
      createMissing: false,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }

  let stat: Awaited<ReturnType<typeof fs.lstat>>;
  try {
    stat = await fs.lstat(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error("Theory runtime persisted receipt must be a regular file.");
  }

  const realProjectRoot = await assertProjectRoot(projectRoot);
  const realPath = await fs.realpath(absolutePath);
  if (
    validatedStore.realDirectory !== (await fs.realpath(storeRoot)) ||
    !isInside(realProjectRoot, realPath)
  ) {
    throw new Error(
      "Theory runtime persisted receipt escaped the real project root.",
    );
  }
  const payload = await fs.readFile(absolutePath);
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.toString("utf8")) as unknown;
  } catch (error) {
    throw new Error(
      `Theory runtime persisted receipt is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (!isTheoryRuntimeReceiptV1(parsed)) {
    throw new Error(
      "Theory runtime persisted receipt failed its v1 contract guard.",
    );
  }
  if (
    parsed.runtimeId !== input.runtimeId ||
    parsed.receiptId !== input.receiptId
  ) {
    throw new Error(
      "Theory runtime persisted receipt identity does not match its immutable lookup key.",
    );
  }

  return {
    receipt: parsed,
    artifact: {
      artifactId: "theory_runtime_persisted_receipt",
      schemaVersion: "theory_runtime_persisted_receipt/v1",
      requestId: input.requestId,
      receiptId: parsed.receiptId,
      path: normalizeRepoPath(path.relative(projectRoot, absolutePath)),
      sha256: createHash("sha256").update(payload).digest("hex"),
      sizeBytes: payload.byteLength,
      writtenAt: stat.birthtime.toISOString(),
    },
  };
}
