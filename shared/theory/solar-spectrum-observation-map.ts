import type { SolarSpectrumObservationBindingInput } from "./solar-spectrum-observation-bindings";

export type SolarSpectrumObservationGroupId =
  | "solar.observation.halpha_shift"
  | "solar.observation.zeeman_split"
  | "solar.observation.blackbody_surface"
  | "solar.observation.flare_energy";

export type SolarSpectrumObservationGroup = {
  id: SolarSpectrumObservationGroupId;
  title: string;
  band: "spectrum" | "magnetic" | "radiation" | "flare";
  description: string;
  theoryBadgeIds: string[];
  calculatorPayloadRefs: Array<{
    badgeId: string;
    payloadId: string;
  }>;
  claimBoundaryBadgeIds: string[];
  objectBindings: Array<{
    id: string;
    label: string;
    description: string;
    input: SolarSpectrumObservationBindingInput;
  }>;
};

const SOLAR_BOUNDARY_BADGES = ["solar.claim_boundary.observational_proxy"];
const H_ALPHA_M = 656.28e-9;

export const SOLAR_SPECTRUM_OBSERVATION_GROUPS: SolarSpectrumObservationGroup[] = [
  {
    id: "solar.observation.halpha_shift",
    title: "H-alpha Shift",
    band: "spectrum",
    description: "Photon energy, line shift, and radial-velocity proxy from a measured H-alpha line.",
    theoryBadgeIds: [
      "solar.spectrum.photon_energy",
      "solar.spectrum.halpha_line_reference",
      "solar.spectrum.doppler_shift",
      "solar.spectrum.radial_velocity_proxy",
      ...SOLAR_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "solar.spectrum.photon_energy", payloadId: "photon_energy_payload" },
      { badgeId: "solar.spectrum.doppler_shift", payloadId: "doppler_shift_payload" },
      { badgeId: "solar.spectrum.radial_velocity_proxy", payloadId: "radial_velocity_proxy_payload" },
    ],
    claimBoundaryBadgeIds: SOLAR_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "halpha-slight-redshift",
        label: "H-alpha shifted line",
        description: "Rest 656.28 nm observed at 656.35 nm.",
        input: {
          objectId: "solar-observation:halpha-slight-redshift",
          label: "H-alpha shifted line",
          lambda: H_ALPHA_M,
          lambda0: H_ALPHA_M,
          lambda_obs: 656.35e-9,
        },
      },
    ],
  },
  {
    id: "solar.observation.zeeman_split",
    title: "Zeeman Split",
    band: "magnetic",
    description: "Simple magnetic line-splitting proxy for a solar spectral line.",
    theoryBadgeIds: [
      "solar.spectrum.halpha_line_reference",
      "solar.magnetic.zeeman_split_proxy",
      ...SOLAR_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "solar.magnetic.zeeman_split_proxy", payloadId: "zeeman_frequency_split_payload" },
      { badgeId: "solar.magnetic.zeeman_split_proxy", payloadId: "zeeman_wavelength_split_payload" },
    ],
    claimBoundaryBadgeIds: SOLAR_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "halpha-zeeman-0p1t",
        label: "H-alpha B=0.1 T",
        description: "H-alpha line with simple effective Lande factor and magnetic field.",
        input: {
          objectId: "solar-observation:halpha-zeeman-0p1t",
          label: "H-alpha Zeeman proxy",
          lambda0: H_ALPHA_M,
          B: 0.1,
          g_eff: 1,
          delta_nu: 1.39962449361e9,
        },
      },
    ],
  },
  {
    id: "solar.observation.blackbody_surface",
    title: "Blackbody Surface",
    band: "radiation",
    description: "Idealized solar Wien peak and Stefan-Boltzmann luminosity rows.",
    theoryBadgeIds: [
      "solar.spectrum.wien_peak",
      "solar.spectrum.blackbody_curve_reference",
      "solar.spectrum.stefan_boltzmann_luminosity",
      ...SOLAR_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "solar.spectrum.wien_peak", payloadId: "wien_peak_payload" },
      {
        badgeId: "solar.spectrum.stefan_boltzmann_luminosity",
        payloadId: "stefan_boltzmann_luminosity_payload",
      },
    ],
    claimBoundaryBadgeIds: SOLAR_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "solar-photosphere-5772k",
        label: "Solar photosphere",
        description: "T=5772 K and R=696340 km idealized surface model.",
        input: {
          objectId: "solar-observation:photosphere-5772k",
          label: "Solar photosphere blackbody proxy",
          T: 5772,
          R: 6.9634e8,
        },
      },
    ],
  },
  {
    id: "solar.observation.flare_energy",
    title: "Flare Energy",
    band: "flare",
    description: "Radiant-power duration proxy for a solar flare event.",
    theoryBadgeIds: [
      "physics.energy.power_rate",
      "solar.flare.energy_proxy",
      ...SOLAR_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "solar.flare.energy_proxy", payloadId: "flare_energy_proxy_payload" },
    ],
    claimBoundaryBadgeIds: SOLAR_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "flare-power-120s",
        label: "120 s flare proxy",
        description: "Radiant-power proxy over a two-minute event.",
        input: {
          objectId: "solar-observation:flare-power-120s",
          label: "120 s flare proxy",
          P_rad: 1e22,
          delta_t: 120,
        },
      },
    ],
  },
];

export function getSolarSpectrumObservationGroup(
  groupId: SolarSpectrumObservationGroupId,
): SolarSpectrumObservationGroup | null {
  return SOLAR_SPECTRUM_OBSERVATION_GROUPS.find((group) => group.id === groupId) ?? null;
}
