import { ipcRenderer } from "electron";
import {
  DESKTOP_TEXTURE_PACK_OVERLAY_CLEAR_CHANNEL,
  DESKTOP_TEXTURE_PACK_OVERLAY_RENDER_CHANNEL,
} from "./channels";

const withProjection = (callback: (image: HTMLImageElement) => void): void => {
  const run = () => {
    const image = document.getElementById("projection");
    if (image instanceof HTMLImageElement) callback(image);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
};

ipcRenderer.on(DESKTOP_TEXTURE_PACK_OVERLAY_RENDER_CHANNEL, (_event, value: unknown) => {
  if (typeof value !== "string" || !/^data:image\/(?:jpeg|png|webp);base64,/i.test(value)) return;
  withProjection((image) => { image.src = value; });
});

ipcRenderer.on(DESKTOP_TEXTURE_PACK_OVERLAY_CLEAR_CHANNEL, () => {
  withProjection((image) => { image.removeAttribute("src"); });
});
