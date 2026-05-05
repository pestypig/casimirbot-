const PLANCK_H = 6.62607015e-34;
const LIGHT_C = 299792458;
const TINY = 1e-30;

export interface PhotonPacketInput {
  wavelength_m: ArrayLike<number>;
  spectral_flux_W_m2_per_m: ArrayLike<number>;
  exposure_s: number;
  collecting_area_m2: number;
  throughput?: ArrayLike<number> | number;
  rng_seed?: string;
  record_packets?: boolean;
}

export interface PhotonPacketBin {
  lambda_center_m: number;
  delta_lambda_m: number;
  photon_energy_J: number;
  expected_count: number;
  sampled_count: number;
  sampled_energy_J: number;
}

export interface PhotonPacketEvent {
  bin_index: number;
  lambda_m: number;
  energy_J: number;
}

export interface PhotonPacketReport {
  bins: PhotonPacketBin[];
  expected_energy_J: number;
  sampled_energy_J: number;
  energy_closure_fraction: number;
  claim: "packetized_measurement_of_continuous_spectrum";
  packets?: PhotonPacketEvent[];
}

export function photonEnergyJ(lambda_m: number): number {
  if (!Number.isFinite(lambda_m) || lambda_m <= 0) throw new Error("lambda_m must be a positive finite wavelength");
  return (PLANCK_H * LIGHT_C) / lambda_m;
}

export function computeWavelengthBinWidths(wavelength_m: ArrayLike<number>): Float64Array {
  if (wavelength_m.length < 2) throw new Error("wavelength_m must contain at least two samples");
  return Float64Array.from({ length: wavelength_m.length }, (_, index) => {
    const current = Number(wavelength_m[index]);
    if (!Number.isFinite(current) || current <= 0) throw new Error("wavelength_m must be positive and finite");
    if (index === 0) return Math.abs(Number(wavelength_m[1]) - current);
    if (index === wavelength_m.length - 1) return Math.abs(current - Number(wavelength_m[index - 1]));
    return Math.abs(Number(wavelength_m[index + 1]) - Number(wavelength_m[index - 1])) / 2;
  });
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRng(seed = "stellar-packet-measurement/v1"): () => number {
  let state = hashSeed(seed) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleNormal(rng: () => number): number {
  const u1 = Math.max(rng(), TINY);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rng());
}

function samplePoisson(mean: number, rng: () => number): number {
  if (!Number.isFinite(mean) || mean <= 0) return 0;
  if (mean >= 30) return Math.max(0, Math.round(mean + Math.sqrt(mean) * sampleNormal(rng)));
  const limit = Math.exp(-mean);
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= rng();
  } while (product > limit);
  return count - 1;
}

function throughputAt(throughput: PhotonPacketInput["throughput"], index: number): number {
  if (throughput === undefined) return 1;
  const value = typeof throughput === "number" ? throughput : Number(throughput[index]);
  if (!Number.isFinite(value) || value < 0) throw new Error("throughput must be finite and non-negative");
  return value;
}

export function packetizeContinuousSpectrum(input: PhotonPacketInput): PhotonPacketReport {
  const { wavelength_m, spectral_flux_W_m2_per_m, exposure_s, collecting_area_m2 } = input;
  if (wavelength_m.length !== spectral_flux_W_m2_per_m.length) {
    throw new Error("wavelength_m and spectral_flux_W_m2_per_m must have the same length");
  }
  if (!Number.isFinite(exposure_s) || exposure_s <= 0) throw new Error("exposure_s must be positive and finite");
  if (!Number.isFinite(collecting_area_m2) || collecting_area_m2 <= 0) {
    throw new Error("collecting_area_m2 must be positive and finite");
  }

  const rng = makeRng(input.rng_seed);
  const widths = computeWavelengthBinWidths(wavelength_m);
  const bins: PhotonPacketBin[] = [];
  const packets: PhotonPacketEvent[] = [];
  let expectedEnergy = 0;
  let sampledEnergy = 0;

  for (let index = 0; index < wavelength_m.length; index += 1) {
    const lambda = Number(wavelength_m[index]);
    const flux = Number(spectral_flux_W_m2_per_m[index]);
    if (!Number.isFinite(flux) || flux < 0) throw new Error("spectral flux must be finite and non-negative");
    const photonEnergy = photonEnergyJ(lambda);
    const binEnergy = flux * collecting_area_m2 * widths[index] * exposure_s * throughputAt(input.throughput, index);
    const expectedCount = binEnergy / photonEnergy;
    const sampledCount = samplePoisson(expectedCount, rng);
    const binSampledEnergy = sampledCount * photonEnergy;
    expectedEnergy += binEnergy;
    sampledEnergy += binSampledEnergy;
    bins.push({
      lambda_center_m: lambda,
      delta_lambda_m: widths[index],
      photon_energy_J: photonEnergy,
      expected_count: expectedCount,
      sampled_count: sampledCount,
      sampled_energy_J: binSampledEnergy,
    });
    if (input.record_packets) {
      for (let eventIndex = 0; eventIndex < sampledCount; eventIndex += 1) {
        packets.push({ bin_index: index, lambda_m: lambda, energy_J: photonEnergy });
      }
    }
  }

  return {
    bins,
    expected_energy_J: expectedEnergy,
    sampled_energy_J: sampledEnergy,
    energy_closure_fraction: expectedEnergy > 0 ? sampledEnergy / expectedEnergy : 1,
    claim: "packetized_measurement_of_continuous_spectrum",
    ...(input.record_packets ? { packets } : {}),
  };
}
