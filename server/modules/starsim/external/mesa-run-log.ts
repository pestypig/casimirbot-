import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { sha256File } from "./mesa-hash-manifest";

export type MesaRunLogInput = {
  path: string;
  runtimeKind: string;
  command?: string;
  exitCode: number;
  stdout?: string;
  stderr?: string;
  message: string;
};

export function writeMesaRunLog(input: MesaRunLogInput) {
  mkdirSync(dirname(input.path), { recursive: true });
  const content = [
    `runtimeKind=${input.runtimeKind}`,
    `command=${input.command ?? ""}`,
    `exitCode=${input.exitCode}`,
    `message=${input.message}`,
    "--- stdout ---",
    input.stdout ?? "",
    "--- stderr ---",
    input.stderr ?? "",
  ].join("\n");
  writeFileSync(input.path, content);
  return { path: input.path, hash: sha256File(input.path) };
}
