import type { AccessClaims } from "../modules/auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AccessClaims;
    }
  }
}

export {};
