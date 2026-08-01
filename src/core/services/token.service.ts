export type AuthTokenPayload = {
  sub: string;
  phone: string;
};

export interface TokenService {
  sign(payload: AuthTokenPayload): string;
  verify(token: string): AuthTokenPayload;
}
