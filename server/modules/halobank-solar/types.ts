export type SolarFrame = "BCRS" | "GCRS";
export type SolarAberration = "none" | "lt" | "lt+s";

export type SolarObserver =
  | {
      mode: "geocenter";
    }
  | {
      mode: "body-fixed";
      body: number;
      lon_deg: number;
      lat_deg: number;
      height_m: number;
    };

export type SolarGateDelta = {
  id: string;
  comparator: "<=" | ">=";
  value: number;
  limit: number;
  pass: boolean;
  note?: string;
};

export type SolarGate = {
  gate: string;
  verdict: "PASS" | "FAIL";
  firstFail: string | null;
  deterministic: true;
  deltas: SolarGateDelta[];
  reasons: string[];
};

export type SolarProvenance = {
  kernel_bundle_id: string;
  source_class: "kernel_bundle" | "fallback";
  claim_tier: "diagnostic";
  certifying: false;
  evidence_refs: string[];
  signature_ok: boolean;
  epoch_window: {
    start_iso: string;
    end_iso: string;
  };
  note: string;
};

export type SolarState = {
  target: number;
  center: number;
  frame: SolarFrame;
  pos: [number, number, number];
  vel: [number, number, number];
  light_time_s: number;
};

export type SolarTimeScales = {
  utc: string;
  tai: string;
  tt: string;
  tcg: string;
  tdb: string;
  tcb: string;
  offsets_s: {
    tai_minus_utc: number;
    tt_minus_utc: number;
    tdb_minus_tt: number;
    tcb_minus_tdb: number;
    tcg_minus_tt: number;
  };
};

export type SolarKernelAsset = {
  id: string;
  kind: "spk" | "pck" | "lsk" | "eop";
  path: string;
  digest: string;
  optional?: boolean;
};

export type SolarKernelBundleManifest = {
  schema_version: "halobank.solar.kernel.bundle/1";
  bundle_id: string;
  release_policy: "pinned-manual-promotion";
  epoch_range: {
    start_iso: string;
    end_iso: string;
  };
  assets: SolarKernelAsset[];
  signature: {
    alg: "sha256";
    signed_payload_hash: string;
    signer: string;
  };
};

export type SolarThresholdsManifest = {
  schema_version: "halobank.solar.thresholds/1";
  epoch_window: {
    start_iso: string;
    end_iso: string;
  };
  modules: {
    mercury_precession: {
      target_arcsec_per_century: number;
      pass_tolerance_arcsec_per_century: number;
      warn_tolerance_arcsec_per_century: number;
      min_perihelion_events: number;
    };
    earth_moon_eclipse_timing: {
      max_contact_separation_deg: number;
      event_time_tolerance_s: number;
    };
    resonance_libration: {
      libration_span_deg_max: number;
      ratio_tolerance: number;
    };
    saros_cycle: {
      target_saros_days: number;
      max_pair_abs_error_days: number;
      min_pair_count: number;
    };
    jovian_moon_event_timing: {
      max_contact_ratio: number;
      event_time_tolerance_s: number;
      min_event_count: number;
    };
  };
};
