import { contextBridge, ipcRenderer } from "electron";
import {
  DESKTOP_RUNTIME_SNAPSHOT_CHANNEL,
  DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_CHANNEL,
  DESKTOP_AUTH0_ACCOUNT_LINK_OPEN_CHANNEL,
  DESKTOP_CODEX_PLUGIN_OPEN_CHANNEL,
  DESKTOP_CODEX_PLUGIN_STATE_CHANNEL,
  DESKTOP_MCP_TUNNEL_CLEAR_CHANNEL,
  DESKTOP_MCP_TUNNEL_CONFIGURE_CHANNEL,
  DESKTOP_MCP_TUNNEL_OPEN_ADMIN_CHANNEL,
  DESKTOP_MCP_TUNNEL_START_CHANNEL,
  DESKTOP_MCP_TUNNEL_STATE_CHANNEL,
  DESKTOP_MCP_TUNNEL_STOP_CHANNEL,
  DESKTOP_UPDATE_CHECK_CHANNEL,
  DESKTOP_UPDATE_DOWNLOAD_CHANNEL,
  DESKTOP_UPDATE_INSTALL_CHANNEL,
  DESKTOP_UPDATE_STATE_CHANNEL,
} from "./channels";

const desktopBridge = Object.freeze({
  getRuntimeSnapshot: () =>
    ipcRenderer.invoke(DESKTOP_RUNTIME_SNAPSHOT_CHANNEL),
  getUpdateState: () => ipcRenderer.invoke(DESKTOP_UPDATE_STATE_CHANNEL),
  checkForUpdates: () => ipcRenderer.invoke(DESKTOP_UPDATE_CHECK_CHANNEL),
  downloadUpdate: () => ipcRenderer.invoke(DESKTOP_UPDATE_DOWNLOAD_CHANNEL),
  installUpdate: () => ipcRenderer.invoke(DESKTOP_UPDATE_INSTALL_CHANNEL),
  getCodexPluginState: () =>
    ipcRenderer.invoke(DESKTOP_CODEX_PLUGIN_STATE_CHANNEL),
  openCodexPlugin: () =>
    ipcRenderer.invoke(DESKTOP_CODEX_PLUGIN_OPEN_CHANNEL),
  getMcpTunnelState: () =>
    ipcRenderer.invoke(DESKTOP_MCP_TUNNEL_STATE_CHANNEL),
  configureMcpTunnel: (input: unknown) =>
    ipcRenderer.invoke(DESKTOP_MCP_TUNNEL_CONFIGURE_CHANNEL, input),
  startMcpTunnel: () =>
    ipcRenderer.invoke(DESKTOP_MCP_TUNNEL_START_CHANNEL),
  stopMcpTunnel: () =>
    ipcRenderer.invoke(DESKTOP_MCP_TUNNEL_STOP_CHANNEL),
  clearMcpTunnel: () =>
    ipcRenderer.invoke(DESKTOP_MCP_TUNNEL_CLEAR_CHANNEL),
  openMcpTunnelAdmin: () =>
    ipcRenderer.invoke(DESKTOP_MCP_TUNNEL_OPEN_ADMIN_CHANNEL),
  openAuth0AccountLink: (authorizationUrl: unknown) =>
    ipcRenderer.invoke(
      DESKTOP_AUTH0_ACCOUNT_LINK_OPEN_CHANNEL,
      authorizationUrl,
    ),
  onAuth0AccountLinkCompletion: (listener: (state: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: unknown) =>
      listener(state);
    ipcRenderer.on(DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_CHANNEL, handler);
    return () =>
      ipcRenderer.removeListener(
        DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_CHANNEL,
        handler,
      );
  },
  onMcpTunnelState: (listener: (state: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: unknown) =>
      listener(state);
    ipcRenderer.on(DESKTOP_MCP_TUNNEL_STATE_CHANNEL, handler);
    return () => ipcRenderer.removeListener(DESKTOP_MCP_TUNNEL_STATE_CHANNEL, handler);
  },
  onUpdateState: (listener: (state: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: unknown) =>
      listener(state);
    ipcRenderer.on(DESKTOP_UPDATE_STATE_CHANNEL, handler);
    return () => ipcRenderer.removeListener(DESKTOP_UPDATE_STATE_CHANNEL, handler);
  },
});

contextBridge.exposeInMainWorld("casimirDesktop", desktopBridge);
