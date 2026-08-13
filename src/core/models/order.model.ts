export type OrderLine = {
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
};

export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";
export type OrderChannel = "whatsapp" | "platform";

export type OrderProps = {
  id: string;
  reference: string;
  storeId: string;
  buyerName: string;
  buyerPhone: string;
  items: OrderLine[];
  total: number;
  channel: OrderChannel;
  status: OrderStatus;
  note: string | null;
  affiliateId: string | null;
  commissionAmount: number;
  createdAt: Date;
  updatedAt: Date;
};

export class Order {
  readonly id: string;
  readonly reference: string;
  readonly storeId: string;
  buyerName: string;
  buyerPhone: string;
  items: OrderLine[];
  total: number;
  channel: OrderChannel;
  status: OrderStatus;
  note: string | null;
  affiliateId: string | null;
  commissionAmount: number;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: OrderProps) {
    this.id = props.id;
    this.reference = props.reference;
    this.storeId = props.storeId;
    this.buyerName = props.buyerName;
    this.buyerPhone = props.buyerPhone;
    this.items = props.items;
    this.total = props.total;
    this.channel = props.channel;
    this.status = props.status;
    this.note = props.note;
    this.affiliateId = props.affiliateId;
    this.commissionAmount = props.commissionAmount;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get itemCount(): number {
    return this.items.reduce((sum, line) => sum + line.quantity, 0);
  }
}

/** Short, unambiguous code a buyer can quote back over WhatsApp. */
export function buildOrderReference(random: string): string {
  return `ZG-${random.toUpperCase().slice(0, 6)}`;
}
