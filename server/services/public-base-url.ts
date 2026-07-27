const normalize = (value: string | undefined): string => value?.trim() ?? "";

const configuredBaseUrl = (): string =>
  normalize(process.env.CASIMIR_PUBLIC_BASE_URL) ||
  normalize(process.env.PUBLIC_BASE_URL) ||
  normalize(process.env.HELIX_PUBLIC_BASE_URL) ||
  normalize(process.env.CASIMIRBOT_PUBLIC_URL) ||
  "https://casimirbot.com";

export const resolveCasimirPublicBaseUrl = (): string => {
  const configured = configuredBaseUrl();
  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error("invalid_casimir_public_base_url");
  }
  if (
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (process.env.NODE_ENV === "production" && parsed.protocol !== "https:")
  ) {
    throw new Error("invalid_casimir_public_base_url");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("invalid_casimir_public_base_url");
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
};
