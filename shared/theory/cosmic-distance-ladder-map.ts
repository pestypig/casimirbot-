import type { CosmicDistanceObjectBindingInput } from "./cosmic-distance-object-bindings";

export type CosmicDistanceLadderRungId =
  | "cosmic.ladder.parallax"
  | "cosmic.ladder.spectral_shift"
  | "cosmic.ladder.cepheid"
  | "cosmic.ladder.low_z_hubble"
  | "cosmic.ladder.accordion_context";

export type CosmicDistanceLadderRung = {
  id: CosmicDistanceLadderRungId;
  title: string;
  band: "local" | "spectrum" | "standard_candle" | "cosmology" | "boundary";
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
    input: CosmicDistanceObjectBindingInput;
  }>;
};

const LADDER_BOUNDARY_BADGES = ["cosmic.claim_boundary.distance_ladder_context"];

export const COSMIC_DISTANCE_LADDER_RUNGS: CosmicDistanceLadderRung[] = [
  {
    id: "cosmic.ladder.parallax",
    title: "Parallax",
    band: "local",
    description: "Local astrometric distance calibration from parallax.",
    theoryBadgeIds: [
      "physics.units.dimension_consistency",
      "cosmic.parallax.distance",
      ...LADDER_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      {
        badgeId: "cosmic.parallax.distance",
        payloadId: "distance_from_parallax_payload",
      },
    ],
    claimBoundaryBadgeIds: LADDER_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "proxima-parallax",
        label: "Proxima-style parallax",
        description: "Nearby-star parallax example.",
        input: {
          objectId: "cosmic-object:proxima-parallax",
          label: "Proxima-style parallax",
          parallax_mas: 768.5,
        },
      },
    ],
  },
  {
    id: "cosmic.ladder.spectral_shift",
    title: "Spectral Shift",
    band: "spectrum",
    description: "Redshift or blueshift from rest and observed line wavelengths.",
    theoryBadgeIds: [
      "physics.quantum.momentum_wavelength",
      "cosmic.spectral.redshift",
      "cosmic.redshift.scale_factor",
      ...LADDER_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      {
        badgeId: "cosmic.spectral.redshift",
        payloadId: "redshift_from_wavelengths_payload",
      },
      {
        badgeId: "cosmic.redshift.scale_factor",
        payloadId: "scale_factor_from_redshift_payload",
      },
    ],
    claimBoundaryBadgeIds: LADDER_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "h-alpha-redshift-0p1",
        label: "H-alpha z≈0.1",
        description: "Rest 656.28 nm observed near 721.91 nm.",
        input: {
          objectId: "cosmic-object:h-alpha-redshift-0p1",
          label: "H-alpha redshift example",
          lambda_rest: 656.28,
          lambda_obs: 721.91,
          z: 0.1,
        },
      },
      {
        id: "h-alpha-blueshift-local",
        label: "H-alpha blueshift",
        description: "Rest 656.28 nm observed at 650 nm.",
        input: {
          objectId: "cosmic-object:h-alpha-blueshift-local",
          label: "H-alpha blueshift example",
          lambda_rest: 656.28,
          lambda_obs: 650,
        },
      },
    ],
  },
  {
    id: "cosmic.ladder.cepheid",
    title: "Cepheid",
    band: "standard_candle",
    description: "Period-luminosity relation followed by distance modulus.",
    theoryBadgeIds: [
      "cosmic.parallax.distance",
      "cosmic.cepheid.period_luminosity",
      "cosmic.standard_candle.distance_modulus",
      ...LADDER_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      {
        badgeId: "cosmic.cepheid.period_luminosity",
        payloadId: "cepheid_absolute_magnitude_payload",
      },
      {
        badgeId: "cosmic.standard_candle.distance_modulus",
        payloadId: "distance_modulus_payload",
      },
    ],
    claimBoundaryBadgeIds: LADDER_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "cepheid-30-day",
        label: "30-day Cepheid",
        description: "Period, calibration constants, apparent magnitude, and absolute magnitude estimate.",
        input: {
          objectId: "cosmic-object:cepheid-30-day",
          label: "30-day Cepheid",
          P_days: 30,
          alpha: -2.76,
          beta: -1.4,
          m_app: 18.5,
          M_abs: -5.48,
        },
      },
    ],
  },
  {
    id: "cosmic.ladder.low_z_hubble",
    title: "Low-z Hubble",
    band: "cosmology",
    description: "Approximate distance from low redshift and H0.",
    theoryBadgeIds: [
      "physics.constants.speed_of_light",
      "cosmic.spectral.redshift",
      "cosmic.low_z.hubble_distance",
      "cosmic.redshift.scale_factor",
      "cosmic.runtime.accordion_context",
      ...LADDER_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      {
        badgeId: "cosmic.low_z.hubble_distance",
        payloadId: "low_z_hubble_distance_payload",
      },
      {
        badgeId: "cosmic.redshift.scale_factor",
        payloadId: "scale_factor_from_redshift_payload",
      },
    ],
    claimBoundaryBadgeIds: LADDER_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "low-z-0p03",
        label: "z=0.03 galaxy",
        description: "Low-redshift Hubble-law example with H0=70.",
        input: {
          objectId: "cosmic-object:low-z-0p03",
          label: "Low-z galaxy",
          z: 0.03,
          H0_km_s_Mpc: 70,
          c_km_s: 299792.458,
        },
      },
    ],
  },
  {
    id: "cosmic.ladder.accordion_context",
    title: "Accordion Context",
    band: "boundary",
    description: "Existing StarSim Accordion redshift and cosmology context boundary.",
    theoryBadgeIds: [
      "cosmic.redshift.scale_factor",
      "cosmic.runtime.accordion_context",
      ...LADDER_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: LADDER_BOUNDARY_BADGES,
    objectBindings: [],
  },
];

export function getCosmicDistanceLadderRung(
  rungId: CosmicDistanceLadderRungId,
): CosmicDistanceLadderRung | null {
  return COSMIC_DISTANCE_LADDER_RUNGS.find((rung) => rung.id === rungId) ?? null;
}
