// client/src/lib/luma-bus.ts
var eventBus = /* @__PURE__ */ new Map();
function publish(eventType, payload) {
  const handlers = eventBus.get(eventType);
  if (handlers) {
    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in Luma event handler for ${eventType}:`, error);
      }
    });
  }
}

// client/src/lib/luma-whispers-core.ts
var SPEAK_COOLDOWN_MS = 2500;
function speakTypewriter(text) {
  if (typeof window === "undefined") return;
  const trimmed = text?.trim();
  if (!trimmed) return;
  const win = window;
  const now = Date.now();
  const state = win.__lumaLastSpeak;
  if (state && now - state.t < SPEAK_COOLDOWN_MS) {
    if (trimmed === state.last) {
      return;
    }
    return;
  }
  publish("luma:whisper", { text: trimmed });
  win.__lumaLastSpeak = { t: now, last: trimmed };
}
var MODE_WHISPERS = {
  Hover: "Form first. Speed follows.",
  "Near-Zero": "Center your split; climb with patience.",
  Cruise: "Timing matched. Take the interval; apply thrust.",
  Emergency: "Breathe once. Choose the useful distance.",
  Standby: "Meet change with correct posture. The rest aligns."
};
var NAVIGATION_WHISPERS = {
  solarInit: "Solar navigation initialized. Near-space trajectory computed.",
  galacticInit: "Galactic coordinates engaged. Interstellar passage mapped.",
  waypointSolar: "Waypoint selected. Route updated.",
  waypointGalactic: "Galactic destination set. Navigation computed.",
  stellarTarget: "Stellar target acquired. Course adjusted."
};
var SYSTEM_WHISPERS = {
  diagnostics: "System pulse taken. All flows nominal.",
  energyUpdate: "Energy cascade balanced. Efficiency optimal.",
  configChange: "Configuration updated. Harmonics stable."
};
function whisperMode(mode) {
  publish("luma:whisper", { text: MODE_WHISPERS[mode] });
}
function whisperNav(context) {
  publish("luma:whisper", { text: NAVIGATION_WHISPERS[context] });
}
function whisperSystem(context) {
  publish("luma:whisper", { text: SYSTEM_WHISPERS[context] });
}
function whisperCustom(text) {
  publish("luma:whisper", { text });
}
function whisperPanelOpen(panelId, title) {
  const label = (title ?? panelId ?? "").toString().trim() || "Panel";
  publish("luma:whisper", {
    text: `Opening ${label}.`,
    tags: ["panel", panelId].filter(Boolean)
  });
}
function publishWhisper(topic, payload) {
  publish(topic, payload);
}
function sendDriveNudge(command) {
  publish("drive:nudge", command);
}
function getModeWisdom(mode) {
  const modeWisdom = {
    hover: "Form first. Speed follows.",
    nearzero: "Hold the split at half; lift comes with patience.",
    cruise: "Steady rhythm creates distance.",
    emergency: "Power serves purpose, not pride.",
    standby: "In stillness, all possibilities rest.",
    taxi: "Ground pace finds the seam before the leap."
  };
  return modeWisdom[mode] || "Balance in all things.";
}
export {
  MODE_WHISPERS,
  NAVIGATION_WHISPERS,
  SYSTEM_WHISPERS,
  getModeWisdom,
  publishWhisper,
  sendDriveNudge,
  speakTypewriter,
  whisperCustom,
  whisperMode,
  whisperNav,
  whisperPanelOpen,
  whisperSystem
};
