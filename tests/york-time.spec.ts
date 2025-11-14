import { describe, expect, it } from "vitest";
import {
  computeSurfaceDivergenceBeta,
  type YorkSample,
  type Vec3,
} from "../client/src/lib/york-time";

const TWO_PI = Math.PI * 2;

const axesUnit = { a: 1, b: 1, c: 1 };

type FieldFn = (pos: Vec3, theta: number, phi: number) => Vec3;

function sampleSphere(thetaCount: number, phiCount: number, field: FieldFn): YorkSample[] {
  const samples: YorkSample[] = [];
  for (let i = 0; i < thetaCount; i += 1) {
    // Include both poles so the grid matches the renderer bands.
    const theta = (i / (thetaCount - 1)) * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    for (let j = 0; j < phiCount; j += 1) {
      const phi = (j / phiCount) * TWO_PI;
      const pos: Vec3 = [
        sinTheta * Math.cos(phi),
        sinTheta * Math.sin(phi),
        cosTheta,
      ];
      const beta = field(pos, theta, phi);
      samples.push({ pos, beta });
    }
  }
  return samples;
}

const constantField: FieldFn = () => [0.05, -0.02, 0.01];

const curlField: FieldFn = (pos) => [-pos[1], pos[0], 0];

const varyingField: FieldFn = (pos, theta, phi) => {
  const tangential: Vec3 = [-pos[1], pos[0], 0];
  const scale = 1 + 0.5 * Math.sin(theta) * Math.cos(phi);
  return [tangential[0] * scale, tangential[1] * scale, tangential[2] * scale];
};

describe("computeSurfaceDivergenceBeta", () => {
  it("returns small divergence for constant tangential fields", () => {
    const samples = sampleSphere(16, 24, constantField);
    const stats = computeSurfaceDivergenceBeta(samples, axesUnit);
    expect(stats.divMax).toBeLessThan(0.2);
    expect(stats.divRMS).toBeLessThan(0.1);
  });

  it("detects positive divergence when the field varies across the shell", () => {
    const samples = sampleSphere(24, 32, varyingField);
    const stats = computeSurfaceDivergenceBeta(samples, axesUnit);
    expect(stats.divMax).toBeGreaterThan(1e-3);
    expect(stats.divRMS).toBeGreaterThan(5e-4);
  });

  it("keeps curl-like tangential fields near divergence-free", () => {
    const samples = sampleSphere(20, 28, curlField);
    const stats = computeSurfaceDivergenceBeta(samples, axesUnit);
    expect(stats.divMax).toBeLessThan(5e-3);
    expect(stats.divRMS).toBeLessThan(2e-3);
  });
});
