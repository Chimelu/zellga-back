export type StoreProps = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  /** Square profile image shown over the cover on the storefront. */
  logoUrl: string | null;
  /** Wide banner behind the store name on the storefront. */
  coverUrl: string | null;
  defaultCheckoutMode: "whatsapp" | "platform";
  /** Store-wide affiliate rate, 0 when the store is not recruiting affiliates. */
  affiliateCommissionPercent: number;
  createdAt: Date;
  updatedAt: Date;
};

export class Store {
  readonly id: string;
  ownerId: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  defaultCheckoutMode: "whatsapp" | "platform";
  affiliateCommissionPercent: number;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: StoreProps) {
    this.id = props.id;
    this.ownerId = props.ownerId;
    this.name = props.name;
    this.slug = props.slug;
    this.category = props.category;
    this.description = props.description;
    this.logoUrl = props.logoUrl;
    this.coverUrl = props.coverUrl;
    this.defaultCheckoutMode = props.defaultCheckoutMode;
    this.affiliateCommissionPercent = props.affiliateCommissionPercent;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
