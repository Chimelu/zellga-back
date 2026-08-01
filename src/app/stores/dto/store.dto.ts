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
