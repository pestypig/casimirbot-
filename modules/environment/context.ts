import { EnvironmentModel, type TEnvironmentModel } from "../../shared/environment-model";

export type EnvironmentInput = {
  session_id: string;
  task?: string;
  repo?: string;
  mode?: string;
  userTags?: string[];
  constraints?: string[];
  metadata?: Record<string, unknown>;
};

const normalizeList = (values?: string[]): string[] =>
  Array.from(new Set((values ?? []).map((v) => v.trim()).filter(Boolean))).slice(0, 16);

export const buildEnvironment = (input: EnvironmentInput): TEnvironmentModel => {
  const env = EnvironmentModel.parse({
    session_id: input.session_id,
    task: input.task,
    repo: input.repo,
    mode: input.mode,
    user_tags: normalizeList(input.userTags),
    constraints: normalizeList(input.constraints),
    environment_tags: [],
    updated_at: Date.now(),
    metadata: input.metadata,
  });
  return {
    ...env,
    environment_tags: deriveTags(env),
  };
};

export const deriveTags = (env: TEnvironmentModel): string[] => {
  const tags = new Set<string>();
  tags.add(`session:${env.session_id}`);
  if (env.task) tags.add(`task:${env.task.slice(0, 48)}`);
  if (env.repo) tags.add(`repo:${env.repo}`);
  if (env.mode) tags.add(`mode:${env.mode}`);
  env.user_tags?.forEach((t) => tags.add(`user:${t}`));
  env.constraints?.forEach((c) => tags.add(`constraint:${c}`));
  (env.environment_tags ?? []).forEach((t) => tags.add(t));
  return Array.from(tags).slice(0, 24);
};

export const signatureFor = (env: TEnvironmentModel): string => {
  const parts = deriveTags(env).sort();
  return parts.join("|");
};
