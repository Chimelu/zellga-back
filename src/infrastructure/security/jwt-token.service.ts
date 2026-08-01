import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../../core/errors/app.error";
import type {
  AuthTokenPayload,
  TokenService,
} from "../../core/services/token.service";
import { env } from "../config/env";

export class JwtTokenService implements TokenService {
  sign(payload: AuthTokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }

  verify(token: string): AuthTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
      if (!decoded?.sub || !decoded?.phone) {
        throw new UnauthorizedError("Invalid token");
      }
      return { sub: decoded.sub, phone: decoded.phone };
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }
  }
}
