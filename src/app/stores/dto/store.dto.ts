export type PublicStoreDto = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  ownerName: string;
  phone: string;
};

export type PublicProductDto = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  media: { url: string; type: "image" | "video" }[];
  category: string | null;
  checkoutMode: "whatsapp" | "platform";
};

export type CreateOrderItemDto = {
  productId: string;
  quantity: number;
};

export type CreateOrderDto = {
  buyerName: string;
  buyerPhone: string;
  items: CreateOrderItemDto[];
  note?: string;
  /** Affiliate ref code from the link the buyer arrived through. */
  ref?: string;
};

export type CreatedOrderDto = {
  id: string;
  reference: string;
  total: number;
  itemCount: number;
  status: "pending" | "paid" | "fulfilled" | "cancelled";
  createdAt: string;
  /** True when the order was credited to an affiliate. */
  attributed: boolean;
};
