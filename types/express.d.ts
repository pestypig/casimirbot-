import type { JwtClaims } from "../server/auth/jwt";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtClaims;
    }
  }
}

export {};
