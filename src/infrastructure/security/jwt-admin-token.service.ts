import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../../core/errors/app.error";
import type {
  AdminTokenPayload,
  AdminTokenService,
} from "../../core/services/token.service";
import { env } from "../config/env";

/** Seller and admin tokens share the secret; the audience keeps them apart. */
const AUDIENCE = "zellga-admin";

export class JwtAdminTokenService implements AdminTokenService {
  sign(payload: AdminTokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      audience: AUDIENCE,
      expiresIn: "12h",
    });
  }

  verify(token: string): AdminTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        audience: AUDIENCE,
      }) as AdminTokenPayload;
      if (!decoded?.sub || !decoded?.email) {
        throw new UnauthorizedError("Invalid token");
      }
      return { sub: decoded.sub, email: decoded.email, demo: decoded.demo === true };
    } catch {
      throw new UnauthorizedError("Invalid or expired session");
    }
  }
}
