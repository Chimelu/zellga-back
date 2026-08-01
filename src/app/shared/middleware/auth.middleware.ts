import { NextFunction, Request, Response } from "express";
import type { TokenService } from "../../../core/services/token.service";
import { UnauthorizedError } from "../../../core/errors/app.error";

export type AuthUser = {
  id: string;
  phone: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function createAuthMiddleware(tokens: TokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      next(new UnauthorizedError("Login required"));
      return;
    }

    try {
      const payload = tokens.verify(header.slice(7));
      req.user = { id: payload.sub, phone: payload.phone };
      next();
    } catch (err) {
      next(err);
    }
  };
}
