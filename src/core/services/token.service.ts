export type AuthTokenPayload = {
  sub: string;
  phone: string;
};

export interface TokenService {
  sign(payload: AuthTokenPayload): string;
  verify(token: string): AuthTokenPayload;
}

/** Console session. Carries no `phone`, so it can never pass as a seller token. */
export type AdminTokenPayload = {
  sub: string;
  email: string;
  demo: boolean;
};

export interface AdminTokenService {
  sign(payload: AdminTokenPayload): string;
  verify(token: string): AdminTokenPayload;
}
