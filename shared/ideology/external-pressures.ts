export const EXTERNAL_PRESSURES = [
  "flattery_grooming",
  "urgency_scarcity",
  "authority_claim",
  "isolation_secrecy",
  "financial_ask",
  "sexualized_attention",
  "status_competition",
  "platform_amplification",
] as const;

export type ExternalPressure = (typeof EXTERNAL_PRESSURES)[number];

export type ExternalPressureBundle = {
  id: string;
  label: string;
  pressures: ExternalPressure[];
  trueIds: string[];
  falseIds: string[];
  edgeBoosts?: Array<{
    from: string;
    to: string;
    weight: number;
  }>;
  warnings?: string[];
};

export type ExternalPressureInput = {
  activePressures: ExternalPressure[];
  observedSignals?: string[];
};

export const EXTERNAL_PRESSURE_BUNDLES: ExternalPressureBundle[] = [
  {
    id: "flattery-financial-urgency",
    label: "Flattery + financial ask + urgency",
    pressures: ["flattery_grooming", "financial_ask", "urgency_scarcity"],
    trueIds: [
      "flattery-laundering-detection",
      "financial-fog-warning",
      "verification-checklist",
    ],
    falseIds: [],
    edgeBoosts: [
      { from: "flattery-laundering-detection", to: "financial-fog-warning", weight: 1.2 },
    ],
    warnings: ["High-pressure financial pattern detected; route to verification-first guidance."],
  },
  {
    id: "secrecy-authority",
    label: "Secrecy + authority claim",
    pressures: ["isolation_secrecy", "authority_claim"],
    trueIds: ["voice-integrity", "capture-resistance"],
    falseIds: [],
  },
];
