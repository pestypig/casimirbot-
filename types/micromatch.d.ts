declare module "micromatch" {
  export interface Micromatch {
    (list: string | string[], patterns: string | readonly string[], options?: unknown): string[];
    isMatch: (str: string, patterns: string | readonly string[], options?: unknown) => boolean;
    matcher: (pattern: string, options?: unknown) => (value: string) => boolean;
  }

  const micromatch: Micromatch;
  export default micromatch;
}
