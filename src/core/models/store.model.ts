export type StoreProps = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  defaultCheckoutMode: "whatsapp" | "platform";
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
  defaultCheckoutMode: "whatsapp" | "platform";
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: StoreProps) {
    this.id = props.id;
    this.ownerId = props.ownerId;
    this.name = props.name;
    this.slug = props.slug;
    this.category = props.category;
    this.description = props.description;
    this.defaultCheckoutMode = props.defaultCheckoutMode;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
