import { C, G } from "./physics-const";

export type GrUnitSystem = "SI" | "geometric";

const C2 = C * C;
const C4 = C2 * C2;

export const SI_TO_GEOM_STRESS = G / C4;
export const GEOM_TO_SI_STRESS = 1 / SI_TO_GEOM_STRESS;

export const toGeometricTime = (seconds: number) =>
  Number.isFinite(seconds) ? seconds * C : seconds;

export const toSiTime = (meters: number) =>
  Number.isFinite(meters) ? meters / C : meters;

export const resolveStressScale = (unitSystem?: GrUnitSystem) =>
  unitSystem === "geometric" ? 1 : SI_TO_GEOM_STRESS;
