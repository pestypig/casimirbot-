export type {
  Nhm2FigureSemanticDomain,
  Nhm2FigureRenderer,
  Nhm2ScientificFigureAtlasManifest,
  Nhm2ScientificFigureKind,
  Nhm2ScientificFigureRecord,
} from "../../shared/contracts/nhm2-scientific-figure-atlas.v1.js";

export interface FigureOutput {
  svg?: string;
  png: string;
  sourceDataJson: string;
}

export interface FigureSourceData {
  figureId: string;
  generatedAt?: string;
  data: unknown;
  notes?: string[];
}
