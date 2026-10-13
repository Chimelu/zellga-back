import { NextFunction, Request, Response } from "express";
import type { AdminTokenService } from "../../../core/services/token.service";
import { UnauthorizedError } from "../../../core/errors/app.error";

export type AuthAdmin = {
  id: string;
  email: string;
  demo: boolean;
};

declare global {
  namespace Express {
    interface Request {
      admin?: AuthAdmin;
    }
  }
}

export function createAdminAuthMiddleware(tokens: AdminTokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      next(new UnauthorizedError("Admin login required"));
      return;
    }

    try {
      const payload = tokens.verify(header.slice(7));
      req.admin = { id: payload.sub, email: payload.email, demo: payload.demo };
      next();
    } catch (err) {
      next(err);
    }
  };
}
