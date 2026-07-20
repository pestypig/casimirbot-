import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  resolveCodexBinary,
  resolveCodexDesktopInstallCandidates,
  resolveFirstLaunchableCodexBinary,
} from "../codex-binary";

const temporaryDirectories: string[] = [];
const originalWorkingDirectory = process.cwd();
const originalEnvironment = {
  CODEX_BIN: process.env.CODEX_BIN,
  CODEX_DISABLE_LOCAL_PACKAGE_BIN: process.env.CODEX_DISABLE_LOCAL_PACKAGE_BIN,
  PATH: process.env.PATH,
  Path: process.env.Path,
};

const makeTemporaryDirectory = (): string => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "helix-codex-binary-"));
  temporaryDirectories.push(directory);
  return directory;
};

afterEach(() => {
  process.chdir(originalWorkingDirectory);
  for (const [name, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("Codex binary resolution", () => {
  it("prefers the newest desktop app binary before the stale root fallback", () => {
    const localAppData = makeTemporaryDirectory();
    const binDirectory = path.join(localAppData, "OpenAI", "Codex", "bin");
    const olderDirectory = path.join(binDirectory, "older-build");
    const newerDirectory = path.join(binDirectory, "newer-build");
    fs.mkdirSync(olderDirectory, { recursive: true });
    fs.mkdirSync(newerDirectory, { recursive: true });
    const olderBinary = path.join(olderDirectory, "codex.exe");
    const newerBinary = path.join(newerDirectory, "codex.exe");
    const rootBinary = path.join(binDirectory, "codex.exe");
    fs.writeFileSync(olderBinary, "older");
    fs.writeFileSync(newerBinary, "newer");
    fs.writeFileSync(rootBinary, "root");
    fs.utimesSync(olderDirectory, new Date(1_000), new Date(1_000));
    fs.utimesSync(newerDirectory, new Date(2_000), new Date(2_000));

    expect(resolveCodexDesktopInstallCandidates(localAppData)).toEqual([
      newerBinary,
      olderBinary,
      rootBinary,
    ]);
  });

  it("continues probing after an existing candidate cannot be spawned", () => {
    const directory = makeTemporaryDirectory();
    const unspawnable = path.join(directory, process.platform === "win32" ? "codex.exe" : "codex");
    fs.writeFileSync(unspawnable, "not an executable image");
    if (process.platform !== "win32") fs.chmodSync(unspawnable, 0o755);

    expect(resolveFirstLaunchableCodexBinary(
      [unspawnable, process.execPath],
      [],
    )).toMatchObject({
      launchable: true,
      reason: null,
      resolved_bin: process.execPath,
    });
  });

  it("resolves the installed npm package independently of the process working directory", () => {
    delete process.env.CODEX_BIN;
    delete process.env.CODEX_DISABLE_LOCAL_PACKAGE_BIN;
    process.env.PATH = "";
    process.env.Path = "";
    process.chdir(makeTemporaryDirectory());

    const resolution = resolveCodexBinary();

    expect(resolution).toMatchObject({
      launchable: true,
      reason: null,
    });
    expect(resolution.resolved_bin).toContain(
      path.join("node_modules", "@openai", "codex", "bin", "codex.js"),
    );
  });
});
