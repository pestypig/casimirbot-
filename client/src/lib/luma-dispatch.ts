import { publish } from "@/lib/luma-bus";

export type LumaType = "nudge" | "whisper" | "brief" | "guide";
export type LumaTheme = "moving_zen" | "maai" | "compassion" | "correct_form" | "accuracy";

export interface LumaMsg {
  id: string;
  type: LumaType;
  theme: LumaTheme;
  title?: string;
  lines: string[];
  linkTo?: string;
}

// Content matrix mapping UI interactions to zen wisdom
const LUMA_CONTENT: Record<string, string[]> = {
  mode_hover: ["Timing matched.", "Hold form; let speed follow."],
  mode_cruise: ["Form stable.", "Now add power—accuracy is final."],
  mode_emergency: ["Swift action.", "Compassion guides precision."],
  mode_standby: ["Rest between breaths.", "Form preserved in stillness."],
  
  route_add: ["Two points set.", "Mind distance + timing (maai)."],
  route_clear: ["Path cleared.", "Empty mind, perfect action."],
  
  diag_pass: ["Systems aligned.", "Form and function in harmony."],
  diag_fail: ["Compassion includes the hull.", "Pause, correct, continue."],
  
  pipeline_update: ["Energy flows as intended.", "Duty and power in balance."],
  
  nav_simulation: ["Configuration shapes reality.", "Mind the parameters—precision guides form."],
  nav_documentation: ["Knowledge illuminates the path.", "Theory and practice unite in wisdom."],
  nav_helix_core: ["The center holds all possibilities.", "Form first, speed follows."],
  nav_trip_planner: ["Journey begins with a single step.", "Choose distance with wisdom."]
};

export function lumaWhisper(kind: string, ctx?: any): void {
  const lines = LUMA_CONTENT[kind] ?? ["Breathe once.", "Choose the useful distance."];
  
  publish("luma:whisper", {
    id: `whisper_${Date.now()}`,
    type: "whisper" as LumaType,
    theme: getThemeForKind(kind),
    lines
  });
}

function getThemeForKind(kind: string): LumaTheme {
  if (kind.startsWith("mode_")) return "moving_zen";
  if (kind.startsWith("route_")) return "maai";
  if (kind.startsWith("diag_")) return "compassion";
  if (kind.startsWith("pipeline_")) return "correct_form";
  return "accuracy";
}

// Enhanced whisper with context-aware content
export function lumaWhisperWithContext(kind: string, ctx: any): void {
  let lines = LUMA_CONTENT[kind] ?? ["Breathe once.", "Choose the useful distance."];
  
  // Add context-specific enhancements
  if (kind === "mode_hover" && ctx?.dutyCycle) {
    lines = [`Timing matched at ${(ctx.dutyCycle * 100).toFixed(1)}%.`, "Hold form; let speed follow."];
  } else if (kind === "mode_cruise" && ctx?.powerMW) {
    lines = [`Power at ${ctx.powerMW.toFixed(1)}MW.`, "Accuracy is final—maintain form."];
  } else if (kind === "route_add" && ctx?.distance) {
    lines = [`${ctx.distance} ly course set.`, "Mind the interval—timing shapes cost."];
  }
  
  publish("luma:whisper", {
    id: `whisper_${Date.now()}`,
    type: "whisper" as LumaType,
    theme: getThemeForKind(kind),
    lines
  });
}