import { G, c } from "./constants";

const DRIVE_PREFAC = (8 * Math.PI * G) / Math.pow(c, 5);
const BODY_PREFAC = (8 * Math.PI * G) / (3 * c * c);

export const curvaturePrefactors = {
  drive: DRIVE_PREFAC,
  body: BODY_PREFAC,
};

export function kappaBody(rho: number) {
  if (!Number.isFinite(rho)) return Number.NaN;
  return BODY_PREFAC * rho;
}

export function kappaDrive(powerPerArea: number, dEff = 1, gain = 1) {
  if (!Number.isFinite(powerPerArea)) return Number.NaN;
  return DRIVE_PREFAC * powerPerArea * dEff * gain;
}

export function kappaDriveFromPower(powerW: number, areaM2: number, dEff = 1, gain = 1) {
  if (!Number.isFinite(powerW) || !Number.isFinite(areaM2) || areaM2 <= 0) {
    return Number.NaN;
  }
  return kappaDrive(powerW / areaM2, dEff, gain);
}

export function potatoEfficiency(kappaDriveValue: number, kappaBodyValue: number) {
  if (!Number.isFinite(kappaDriveValue) || !Number.isFinite(kappaBodyValue) || kappaBodyValue === 0) {
    return Number.NaN;
  }
  return kappaDriveValue / kappaBodyValue;
}
