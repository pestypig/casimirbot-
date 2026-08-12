import { app } from "electron";
import { autoUpdater } from "electron-updater";
import {
  DESKTOP_UPDATE_STATE_SCHEMA_VERSION,
  type DesktopUpdatePhase,
  type DesktopUpdateState,
} from "../../../shared/desktop-update";

type UpdateStatePublisher = (state: DesktopUpdateState) => void;

const errorCode = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  if (/signature/i.test(message)) return "signature_verification_failed";
  if (/checksum|sha512/i.test(message)) return "checksum_verification_failed";
  if (/network|ENOTFOUND|ECONN|ETIMEDOUT/i.test(message)) {
    return "update_network_error";
  }
  return "update_failed";
};

export class DesktopUpdateController {
  private state: DesktopUpdateState;
  private initialized = false;

  constructor(
    private readonly packaged: boolean,
    private readonly publish: UpdateStatePublisher,
  ) {
    this.state = this.buildState(packaged ? "idle" : "unavailable");
  }

  private buildState(
    phase: DesktopUpdatePhase,
    patch: Partial<DesktopUpdateState> = {},
  ): DesktopUpdateState {
    return Object.freeze({
      schemaVersion: DESKTOP_UPDATE_STATE_SCHEMA_VERSION,
      phase,
      currentVersion: app.getVersion(),
      availableVersion: null,
      progressPercent: null,
      errorCode: null,
      canCheck: this.packaged && ["idle", "available", "error"].includes(phase),
      canDownload: this.packaged && phase === "available",
      canInstall: this.packaged && phase === "downloaded",
      ...patch,
    });
  }

  private setState(
    phase: DesktopUpdatePhase,
    patch: Partial<DesktopUpdateState> = {},
  ): void {
    this.state = this.buildState(phase, patch);
    this.publish(this.state);
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    if (!this.packaged) return;

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowDowngrade = false;
    autoUpdater.disableWebInstaller = true;

    autoUpdater.on("checking-for-update", () => this.setState("checking"));
    autoUpdater.on("update-not-available", () => this.setState("idle"));
    autoUpdater.on("update-available", (info) => {
      this.setState("available", { availableVersion: info.version });
    });
    autoUpdater.on("download-progress", (progress) => {
      this.setState("downloading", {
        availableVersion: this.state.availableVersion,
        progressPercent: Math.max(0, Math.min(100, progress.percent)),
      });
    });
    autoUpdater.on("update-downloaded", (info) => {
      this.setState("downloaded", { availableVersion: info.version });
    });
    autoUpdater.on("error", (error) => {
      this.setState("error", {
        availableVersion: this.state.availableVersion,
        errorCode: errorCode(error),
      });
    });
  }

  getState(): DesktopUpdateState {
    return this.state;
  }

  async check(): Promise<DesktopUpdateState> {
    if (!this.state.canCheck) return this.state;
    this.setState("checking");
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.setState("error", { errorCode: errorCode(error) });
    }
    return this.state;
  }

  async download(): Promise<DesktopUpdateState> {
    if (!this.state.canDownload) return this.state;
    this.setState("downloading", {
      availableVersion: this.state.availableVersion,
      progressPercent: 0,
    });
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      this.setState("error", {
        availableVersion: this.state.availableVersion,
        errorCode: errorCode(error),
      });
    }
    return this.state;
  }

  install(): DesktopUpdateState {
    if (!this.state.canInstall) return this.state;
    autoUpdater.quitAndInstall(false, true);
    return this.state;
  }
}
