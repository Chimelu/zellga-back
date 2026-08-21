import type { CheckoutMode } from "../../../core/models/store.model";
import type { OfferDetails, OfferType } from "../../../core/models/offer.model";

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
  checkoutMode?: CheckoutMode;
  available?: boolean;
  media?: ProductMediaDto[];
  /** Defaults to `physical`, which is all the catalogue held before types. */
  offerType?: OfferType;
  subtype?: string;
  /** Type-specific fields; validated against the schema for `offerType`. */
  details?: OfferDetails;
};

export type UpdateProductDto = {
  name?: string;
  price?: number;
  description?: string | null;
  category?: string | null;
  checkoutMode?: CheckoutMode;
  media?: ProductMediaDto[];
  offerType?: OfferType;
  subtype?: string;
  details?: OfferDetails;
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
  checkoutMode: CheckoutMode;
  offerType: OfferType;
  subtype: string | null;
  details: OfferDetails;
  createdAt: string;
  updatedAt: string;
};
