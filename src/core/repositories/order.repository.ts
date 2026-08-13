import type { Order } from "../models/order.model";

export interface OrderRepository {
  findByReference(reference: string): Promise<Order | null>;
  save(order: Order): Promise<Order>;
}
