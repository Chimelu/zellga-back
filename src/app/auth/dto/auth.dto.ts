export type RegisterDto = {
  name: string;
  phone: string;
  password: string;
  storeName: string;
  category?: string;
};

export type LoginDto = {
  phone: string;
  password: string;
};

export type AuthUserDto = {
  id: string;
  name: string;
  phone: string;
};

export type AuthStoreDto = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
};

export type AuthResponseDto = {
  token: string;
  user: AuthUserDto;
  store: AuthStoreDto | null;
};
