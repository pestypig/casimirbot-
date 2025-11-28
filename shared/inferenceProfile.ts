export type DetailLevel = "short" | "medium" | "long";
export type TonePreference = "neutral-analytical" | "direct" | "playful" | "formal";

export interface InteractionStyle {
  prefers_bullets?: boolean;
  prefers_code?: boolean;
  detail_level?: DetailLevel;
  tone_preference?: TonePreference;
}

export interface FocusAreas {
  learning?: number;
  health?: number;
  creative_work?: number;
  relationships?: number;
  execution_ops?: number;
}

export interface AspirationSignals {
  craftsmanship?: number;
  autonomy?: number;
  stability?: number;
  exploration?: number;
}

export type BatchingPreference = "low" | "medium" | "high";

export interface RhythmSignals {
  likes_short_sessions?: boolean;
  batching_preference?: BatchingPreference;
}

export interface SustainabilitySignals {
  prefers_small_steps?: boolean;
  follow_through_rate?: number;
}

export interface LongevitySignals {
  recurring_themes?: string[];
}

export interface EssenceProfile {
  essence_id: string;
  created_at: string;
  updated_at: string;
  interaction_style?: InteractionStyle;
  focus_areas?: FocusAreas;
  aspiration_signals?: AspirationSignals;
  rhythms?: RhythmSignals;
  sustainability?: SustainabilitySignals;
  longevity?: LongevitySignals;
  disabled_dimensions?: string[];
}

export type EssenceProfileUpdate = Partial<Omit<EssenceProfile, "essence_id" | "created_at" | "updated_at">>;

export interface EssenceProfileSummaryResult {
  focus_areas?: FocusAreas;
  aspiration_signals?: AspirationSignals;
  interaction_style?: InteractionStyle;
  rhythms?: RhythmSignals;
  sustainability?: SustainabilitySignals;
  longevity?: LongevitySignals;
  notes?: string[];
  updated_at: string;
}
