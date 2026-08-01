export type ProductMediaDto = {
  url: string;
  publicId: string;
  type: "image" | "video";
};

export type CreateProductDto = {
  name: string;
  price: number;
  description?: string;
  category?: string;
  checkoutMode?: "whatsapp" | "platform";
  available?: boolean;
  media?: ProductMediaDto[];
};

export type UpdateProductDto = {
  name?: string;
  price?: number;
  description?: string | null;
  category?: string | null;
  checkoutMode?: "whatsapp" | "platform";
  media?: ProductMediaDto[];
};

export type SetProductVisibilityDto = {
  available: boolean;
};

export type ProductResponseDto = {
  id: string;
  storeId: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  media: ProductMediaDto[];
  available: boolean;
  category: string | null;
  checkoutMode: "whatsapp" | "platform";
  createdAt: string;
  updatedAt: string;
};
