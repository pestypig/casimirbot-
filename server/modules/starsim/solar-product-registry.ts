import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { hashStableJson } from "../../utils/information-boundary";
import {
  starSimSolarBaselineSectionIdSchema,
  starSimSolarObservedModeSchema,
  type StarSimSolarBaselineSectionId,
} from "./solar-contract";
import { getSolarReferencePack } from "./solar-reference-pack";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const cadenceUnitSchema = z.enum(["s", "min", "hour", "day", "carrington_rotation", "snapshot"]);

const solarProductRegistryEntrySchema = z.object({
  id: z.string().min(1),
  product_family: z.string().min(1),
  supported_sections: z.array(starSimSolarBaselineSectionIdSchema).min(1),
  reference_doc_ids: z.array(z.string().min(1)).min(1),
  instrument: z.string().min(1),
  observed_mode: starSimSolarObservedModeSchema,
  coordinate_frame: z.string().min(1).optional(),
  cadence_units: z.array(cadenceUnitSchema).min(1).optional(),
  note: z.string().min(1).optional(),
});

const solarProductRegistrySchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  products: z.record(z.string(), solarProductRegistryEntrySchema),
});

export type StarSimSolarProductRegistryEntry = z.infer<typeof solarProductRegistryEntrySchema>;
export type StarSimSolarProductRegistry = z.infer<typeof solarProductRegistrySchema>;

export interface StarSimSolarProductRegistryIdentity {
  id: string;
  version: string;
  content_hash: string;
  ref: string;
}

export interface LoadedStarSimSolarProductRegistry extends StarSimSolarProductRegistryIdentity {
  registry: StarSimSolarProductRegistry;
}

export const SOLAR_PRODUCT_REGISTRY_RELATIVE_PATH = "data/starsim/solar-product-registry.v1.json" as const;

let solarProductRegistryOverride: LoadedStarSimSolarProductRegistry | null = null;
let cachedSolarProductRegistry: LoadedStarSimSolarProductRegistry | null = null;

const normalizeRef = (filePath: string): string => path.relative(process.cwd(), filePath).replace(/\\/g, "/");

const validateSolarProductRegistry = (
  registryCandidate: unknown,
  sourceLabel: string,
): StarSimSolarProductRegistry => {
  const parsed = solarProductRegistrySchema.safeParse(registryCandidate);
  if (!parsed.success) {
    throw new Error(`Invalid solar product registry at ${sourceLabel}: ${parsed.error.message}`);
  }
  const registry = parsed.data;
  const seenProductIds = new Set<string>();
  const referencePackDocIds = new Set(Object.keys(getSolarReferencePack().docs));
  const supportedSections = new Set<StarSimSolarBaselineSectionId>();

  for (const [productKey, product] of Object.entries(registry.products)) {
    if (product.id !== productKey) {
      throw new Error(`Invalid solar product registry at ${sourceLabel}: product key ${productKey} must match product.id ${product.id}.`);
    }
    if (seenProductIds.has(product.id)) {
      throw new Error(`Invalid solar product registry at ${sourceLabel}: duplicate product id ${product.id}.`);
    }
    seenProductIds.add(product.id);
    for (const sectionId of product.supported_sections) {
      supportedSections.add(sectionId);
    }
    for (const docId of product.reference_doc_ids) {
      if (!referencePackDocIds.has(docId)) {
        throw new Error(
          `Invalid solar product registry at ${sourceLabel}: product ${product.id} references unknown doc id ${docId}.`,
        );
      }
    }
  }

  if (supportedSections.size === 0) {
    throw new Error(`Invalid solar product registry at ${sourceLabel}: at least one supported section must be declared.`);
  }

  return registry;
};

const finalizeLoadedRegistry = (
  registry: StarSimSolarProductRegistry,
  ref: string,
): LoadedStarSimSolarProductRegistry => ({
  id: registry.id,
  version: registry.version,
  content_hash: hashStableJson(registry),
  ref,
  registry,
});

export const loadSolarProductRegistryFromPath = (filePath: string): LoadedStarSimSolarProductRegistry => {
  const sourceLabel = path.resolve(filePath);
  let raw: string;
  try {
    raw = fs.readFileSync(sourceLabel, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read solar product registry at ${sourceLabel}: ${message}`);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse solar product registry JSON at ${sourceLabel}: ${message}`);
  }

  const registry = validateSolarProductRegistry(parsedJson, sourceLabel);
  return finalizeLoadedRegistry(registry, normalizeRef(sourceLabel));
};

const loadDefaultSolarProductRegistry = (): LoadedStarSimSolarProductRegistry => {
  const absolutePath = path.resolve(process.cwd(), SOLAR_PRODUCT_REGISTRY_RELATIVE_PATH);
  return loadSolarProductRegistryFromPath(absolutePath);
};

const getLoadedSolarProductRegistry = (): LoadedStarSimSolarProductRegistry => {
  if (solarProductRegistryOverride) {
    return clone(solarProductRegistryOverride);
  }
  if (!cachedSolarProductRegistry) {
    cachedSolarProductRegistry = loadDefaultSolarProductRegistry();
  }
  return clone(cachedSolarProductRegistry);
};

export const getSolarProductRegistry = (): StarSimSolarProductRegistry => getLoadedSolarProductRegistry().registry;

export const getSolarProductRegistryIdentity = (): StarSimSolarProductRegistryIdentity => {
  const loaded = getLoadedSolarProductRegistry();
  return {
    id: loaded.id,
    version: loaded.version,
    content_hash: loaded.content_hash,
    ref: loaded.ref,
  };
};

export const getSolarProductRegistryEntry = (productId: string): StarSimSolarProductRegistryEntry | null => {
  const registry = getSolarProductRegistry();
  return registry.products[productId] ?? null;
};

export const __setSolarProductRegistryForTest = (registry: StarSimSolarProductRegistry | null): void => {
  solarProductRegistryOverride = registry
    ? finalizeLoadedRegistry(validateSolarProductRegistry(clone(registry), "test override"), "test:override")
    : null;
};

export const __resetSolarProductRegistryForTest = (): void => {
  solarProductRegistryOverride = null;
  cachedSolarProductRegistry = null;
};
