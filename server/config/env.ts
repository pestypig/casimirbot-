// Centralized environment switches for server features
const flagEnabled = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
};

export const QI_AUTOTHROTTLE_ENABLE = flagEnabled(process.env.QI_AUTOTHROTTLE_ENABLE, false);
export const QI_AUTOTHROTTLE_TARGET = Number(process.env.QI_AUTOTHROTTLE_TARGET ?? 0.9);
export const QI_AUTOTHROTTLE_HYST = Number(process.env.QI_AUTOTHROTTLE_HYST ?? 0.05);
export const QI_AUTOTHROTTLE_MIN = Number(process.env.QI_AUTOTHROTTLE_MIN ?? 0.02);
export const QI_AUTOTHROTTLE_ALPHA = Number(process.env.QI_AUTOTHROTTLE_ALPHA ?? 0.25);
export const QI_AUTOTHROTTLE_COOLDOWN_MS = Number(
  process.env.QI_AUTOTHROTTLE_COOLDOWN_MS ?? 1000,
);
export const QI_AUTOSCALE_ENABLE = flagEnabled(process.env.QI_AUTOSCALE_ENABLE, true);
export const QI_AUTOSCALE_TARGET = Number(process.env.QI_AUTOSCALE_TARGET ?? 0.9);
export const QI_AUTOSCALE_MIN_SCALE = Number(process.env.QI_AUTOSCALE_MIN_SCALE ?? 0.02);
export const QI_AUTOSCALE_SLEW = Number(process.env.QI_AUTOSCALE_SLEW ?? 0.25);
export const QI_AUTOSCALE_NO_EFFECT_SEC = Number(
  process.env.QI_AUTOSCALE_NO_EFFECT_SEC ?? 5,
);
