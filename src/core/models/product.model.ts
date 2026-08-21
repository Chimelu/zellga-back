import type { CheckoutMode } from "./store.model";
import type { OfferDetails, OfferType } from "./offer.model";

export type ProductMediaItem = {
  url: string;
  publicId: string;
  type: "image" | "video";
};

export type ProductProps = {
  id: string;
  storeId: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  media: ProductMediaItem[];
  /** false = hidden from public store link */
  available: boolean;
  category: string | null;
  checkoutMode: CheckoutMode;
  /** What kind of thing this is — see `OfferType`. */
  offerType: OfferType;
  /** Narrower kind within the type, e.g. `course` under `digital`. */
  subtype: string | null;
  /** Type-specific fields; shape follows `offerType`. */
  details: OfferDetails;
  createdAt: Date;
  updatedAt: Date;
};

export class Product {
  readonly id: string;
  storeId: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  media: ProductMediaItem[];
  available: boolean;
  category: string | null;
  checkoutMode: CheckoutMode;
  offerType: OfferType;
  subtype: string | null;
  details: OfferDetails;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: ProductProps) {
    this.id = props.id;
    this.storeId = props.storeId;
    this.name = props.name;
    this.price = props.price;
    this.description = props.description;
    this.imageUrl = props.imageUrl;
    this.imagePublicId = props.imagePublicId;
    this.media = props.media;
    this.available = props.available;
    this.category = props.category;
    this.checkoutMode = props.checkoutMode;
    this.offerType = props.offerType;
    this.subtype = props.subtype;
    this.details = props.details;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
