export const FIGURE_BACKGROUND = "#05080d";
export const FIGURE_FOREGROUND = "#dbeaf1";

export const STATUS_COLORS = {
  pass: "#34c99a",
  review: "#f0aa42",
  fail: "#e85d42",
  locked: "#7f9cff",
  neutral: "#9aa8b2",
  missing: "#f0aa42",
} as const;

export const SEQUENTIAL_TEAL = ["#08131c", "#0e3543", "#15606f", "#1f8c98", "#35bfca", "#91edf2"];
export const DIVERGING_BLUE_ORANGE = ["#2858a6", "#68b7d4", "#e8eef0", "#f0b35a", "#d95b3d"];

export function statusColor(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes("pass")) return STATUS_COLORS.pass;
  if (normalized.includes("fail")) return STATUS_COLORS.fail;
  if (normalized.includes("lock")) return STATUS_COLORS.locked;
  if (normalized.includes("missing") || normalized.includes("review") || normalized.includes("pending")) return STATUS_COLORS.review;
  return STATUS_COLORS.neutral;
}

export function escapeXml(text: unknown): string {
  return String(text).replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return char;
    }
  });
}
