import { readFileSync } from "node:fs";
import { z } from "zod";
import type { StarSimAccordionStarNode } from "../../../../shared/starsim-accordion-galactic-null-model";

export const gaiaStructureImportSchema = z.object({
  schemaVersion: z.literal("starsim-gaia-structure-import.v1"),
  rows: z.array(
    z.object({
      objectId: z.string().min(1),
      ra_deg: z.number().optional(),
      dec_deg: z.number().optional(),
      parallax_mas: z.number().optional(),
      distance_pc: z.number().nonnegative().optional(),
      pmra_masyr: z.number().optional(),
      pmdec_masyr: z.number().optional(),
      radialVelocity_km_s: z.number().optional(),
      spectralType: z.string().optional(),
      objectClass: z.enum([
        "main_sequence",
        "red_dwarf",
        "red_giant",
        "white_dwarf",
        "neutron_star",
        "brown_dwarf",
        "unknown",
      ]),
    }),
  ),
});

export function loadGaiaStructureImport(path: string): Omit<StarSimAccordionStarNode, "qstAnnotation">[] {
  const payload = gaiaStructureImportSchema.parse(JSON.parse(readFileSync(path, "utf8")));
  return payload.rows.map((row) => ({
    objectId: row.objectId,
    coordinates: {
      ra_deg: row.ra_deg,
      dec_deg: row.dec_deg,
      parallax_mas: row.parallax_mas,
      distance_pc: row.distance_pc,
      properMotion_masyr:
        row.pmra_masyr !== undefined && row.pmdec_masyr !== undefined
          ? [row.pmra_masyr, row.pmdec_masyr]
          : undefined,
      radialVelocity_km_s: row.radialVelocity_km_s,
    },
    stellarClassification: {
      spectralType: row.spectralType,
      objectClass: row.objectClass,
    },
    fusionPrior: inferFusionPrior(row.objectClass, row.spectralType),
  }));
}

function inferFusionPrior(
  objectClass: StarSimAccordionStarNode["stellarClassification"]["objectClass"],
  spectralType?: string,
): Omit<StarSimAccordionStarNode, "qstAnnotation">["fusionPrior"] {
  if (objectClass === "neutron_star") {
    return {
      dominantFusionChannel: "compact_object_not_fusing",
      fusionZoneMode: "compact_object_not_applicable",
      quantumMicrophysicsRole: "degenerate_compact_object_quantum_fluid",
    };
  }
  if (objectClass === "white_dwarf" || objectClass === "brown_dwarf") {
    return {
      dominantFusionChannel: "none",
      fusionZoneMode: "unknown",
      quantumMicrophysicsRole: "not_applicable",
    };
  }
  const hot = spectralType?.startsWith("O") || spectralType?.startsWith("B") || spectralType?.startsWith("A");
  return {
    dominantFusionChannel: hot ? "cno_cycle" : "pp_chain",
    fusionZoneMode: objectClass === "red_giant" ? "shell_fusion" : "core_fusion",
    quantumMicrophysicsRole: "microphysical_rate_law",
  };
}
