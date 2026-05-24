export const HELIX_PHYSICAL_DIMENSION_KEYS = [
  "length",
  "mass",
  "time",
  "electric_current",
  "thermodynamic_temperature",
  "amount_of_substance",
  "luminous_intensity",
] as const;

export type HelixPhysicalDimensionKey = (typeof HELIX_PHYSICAL_DIMENSION_KEYS)[number];

export type HelixPhysicalDimension = Record<HelixPhysicalDimensionKey, number>;

export type HelixPhysicalUnitDefinition = {
  symbol: string;
  label: string;
  quantity: string;
  dimension: HelixPhysicalDimension;
  si_factor: number;
  aliases?: string[];
};

export function helixDimension(input: Partial<HelixPhysicalDimension> = {}): HelixPhysicalDimension {
  return {
    length: input.length ?? 0,
    mass: input.mass ?? 0,
    time: input.time ?? 0,
    electric_current: input.electric_current ?? 0,
    thermodynamic_temperature: input.thermodynamic_temperature ?? 0,
    amount_of_substance: input.amount_of_substance ?? 0,
    luminous_intensity: input.luminous_intensity ?? 0,
  };
}

export function scaleHelixDimension(dimension: HelixPhysicalDimension, scalar: number): HelixPhysicalDimension {
  return helixDimension(
    Object.fromEntries(
      HELIX_PHYSICAL_DIMENSION_KEYS.map((key) => [key, dimension[key] * scalar]),
    ) as Partial<HelixPhysicalDimension>,
  );
}

export function addHelixDimensions(...dimensions: HelixPhysicalDimension[]): HelixPhysicalDimension {
  return helixDimension(
    Object.fromEntries(
      HELIX_PHYSICAL_DIMENSION_KEYS.map((key) => [
        key,
        dimensions.reduce((total, dimension) => total + dimension[key], 0),
      ]),
    ) as Partial<HelixPhysicalDimension>,
  );
}

const DIMENSIONLESS = helixDimension();
const LENGTH = helixDimension({ length: 1 });
const MASS = helixDimension({ mass: 1 });
const TIME = helixDimension({ time: 1 });
const CURRENT = helixDimension({ electric_current: 1 });
const TEMPERATURE = helixDimension({ thermodynamic_temperature: 1 });
const AMOUNT = helixDimension({ amount_of_substance: 1 });
const LUMINOUS = helixDimension({ luminous_intensity: 1 });
const SPEED = helixDimension({ length: 1, time: -1 });
const FREQUENCY = helixDimension({ time: -1 });
const ENERGY = helixDimension({ mass: 1, length: 2, time: -2 });
const ACTION = helixDimension({ mass: 1, length: 2, time: -1 });
const FORCE = helixDimension({ mass: 1, length: 1, time: -2 });
const MOMENTUM = helixDimension({ mass: 1, length: 1, time: -1 });
const POWER = helixDimension({ mass: 1, length: 2, time: -3 });
const CHARGE = helixDimension({ electric_current: 1, time: 1 });
const VOLTAGE = helixDimension({ mass: 1, length: 2, time: -3, electric_current: -1 });
const PRESSURE = helixDimension({ mass: 1, length: -1, time: -2 });

export const HELIX_PHYSICAL_UNITS: HelixPhysicalUnitDefinition[] = [
  { symbol: "1", label: "dimensionless", quantity: "dimensionless", dimension: DIMENSIONLESS, si_factor: 1 },
  { symbol: "m", label: "metre", quantity: "length", dimension: LENGTH, si_factor: 1, aliases: ["meter", "metre", "meters", "metres"] },
  { symbol: "nm", label: "nanometre", quantity: "length", dimension: LENGTH, si_factor: 1e-9, aliases: ["nanometer", "nanometre", "nanometers", "nanometres"] },
  { symbol: "km", label: "kilometre", quantity: "length", dimension: LENGTH, si_factor: 1e3, aliases: ["kilometer", "kilometre", "kilometers", "kilometres"] },
  { symbol: "kg", label: "kilogram", quantity: "mass", dimension: MASS, si_factor: 1, aliases: ["kilogram", "kilograms"] },
  { symbol: "g", label: "gram", quantity: "mass", dimension: MASS, si_factor: 1e-3, aliases: ["gram", "grams"] },
  { symbol: "s", label: "second", quantity: "time", dimension: TIME, si_factor: 1, aliases: ["sec", "second", "seconds"] },
  { symbol: "ms", label: "millisecond", quantity: "time", dimension: TIME, si_factor: 1e-3, aliases: ["millisecond", "milliseconds"] },
  { symbol: "m/s", label: "metre per second", quantity: "speed", dimension: SPEED, si_factor: 1, aliases: ["meter per second", "metre per second", "meters per second", "metres per second"] },
  { symbol: "Hz", label: "hertz", quantity: "frequency", dimension: FREQUENCY, si_factor: 1, aliases: ["hz", "hertz"] },
  { symbol: "J", label: "joule", quantity: "energy", dimension: ENERGY, si_factor: 1, aliases: ["j", "joule", "joules"] },
  { symbol: "eV", label: "electronvolt", quantity: "energy", dimension: ENERGY, si_factor: 1.602176634e-19, aliases: ["ev", "electronvolt", "electronvolts"] },
  { symbol: "J*s", label: "joule second", quantity: "action", dimension: ACTION, si_factor: 1, aliases: ["J s", "joule second", "joule seconds"] },
  { symbol: "N", label: "newton", quantity: "force", dimension: FORCE, si_factor: 1, aliases: ["n", "newton", "newtons"] },
  { symbol: "kg*m/s", label: "kilogram metre per second", quantity: "momentum", dimension: MOMENTUM, si_factor: 1, aliases: ["kg m/s", "kg*m*s^-1", "kg m s^-1", "kilogram meter per second", "kilogram metre per second"] },
  { symbol: "W", label: "watt", quantity: "power", dimension: POWER, si_factor: 1, aliases: ["w", "watt", "watts"] },
  { symbol: "C", label: "coulomb", quantity: "electric_charge", dimension: CHARGE, si_factor: 1, aliases: ["coulomb", "coulombs"] },
  { symbol: "V", label: "volt", quantity: "electric_potential", dimension: VOLTAGE, si_factor: 1, aliases: ["v", "volt", "volts"] },
  { symbol: "Pa", label: "pascal", quantity: "pressure", dimension: PRESSURE, si_factor: 1, aliases: ["pa", "pascal", "pascals"] },
  { symbol: "K", label: "kelvin", quantity: "temperature", dimension: TEMPERATURE, si_factor: 1, aliases: ["kelvin"] },
  { symbol: "mol", label: "mole", quantity: "amount_of_substance", dimension: AMOUNT, si_factor: 1, aliases: ["mole", "moles"] },
  { symbol: "cd", label: "candela", quantity: "luminous_intensity", dimension: LUMINOUS, si_factor: 1, aliases: ["candela", "candelas"] },
];

function normalizeUnitToken(unit: string): string {
  return unit.trim().replace(/\s+/g, " ");
}

export function findHelixUnitDefinition(unit: string | null | undefined): HelixPhysicalUnitDefinition | null {
  const normalized = normalizeUnitToken(String(unit ?? ""));
  if (!normalized) return null;
  const exact = HELIX_PHYSICAL_UNITS.find((entry) => entry.symbol === normalized);
  if (exact) return exact;
  const lower = normalized.toLowerCase();
  return (
    HELIX_PHYSICAL_UNITS.find((entry) => entry.symbol.toLowerCase() === lower || entry.aliases?.some((alias) => alias.toLowerCase() === lower)) ??
    null
  );
}

export function inferHelixQuantityForUnit(unit: string | null | undefined): string | null {
  return findHelixUnitDefinition(unit)?.quantity ?? null;
}

export function inferHelixDimensionForUnit(unit: string | null | undefined): HelixPhysicalDimension | null {
  return findHelixUnitDefinition(unit)?.dimension ?? null;
}

export function formatHelixDimensionSignature(dimension: HelixPhysicalDimension | null | undefined): string | null {
  if (!dimension) return null;
  const symbols: Record<HelixPhysicalDimensionKey, string> = {
    length: "L",
    mass: "M",
    time: "T",
    electric_current: "I",
    thermodynamic_temperature: "Theta",
    amount_of_substance: "N",
    luminous_intensity: "Jv",
  };
  const parts = HELIX_PHYSICAL_DIMENSION_KEYS.flatMap((key) => {
    const exponent = dimension[key];
    if (!exponent) return [];
    return exponent === 1 ? [symbols[key]] : [`${symbols[key]}^${exponent}`];
  });
  return parts.length ? parts.join(" ") : "1";
}

export function helixUnitsForQuantity(quantity: string | null | undefined): HelixPhysicalUnitDefinition[] {
  const normalized = String(quantity ?? "").trim().toLowerCase();
  if (!normalized) return [];
  return HELIX_PHYSICAL_UNITS.filter((entry) => entry.quantity.toLowerCase() === normalized);
}
