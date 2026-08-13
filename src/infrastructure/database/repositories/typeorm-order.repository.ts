import { Repository } from "typeorm";
import { Order } from "../../../core/models/order.model";
import type { OrderRepository } from "../../../core/repositories/order.repository";
import { AppDataSource } from "../data-source";
import { OrderOrmEntity } from "../entities/order.orm-entity";

function toDomain(row: OrderOrmEntity): Order {
  return new Order({
    id: row.id,
    reference: row.reference,
    storeId: row.storeId,
    buyerName: row.buyerName,
    buyerPhone: row.buyerPhone,
    items: Array.isArray(row.items) ? row.items : [],
    total: Number(row.total ?? 0),
    channel: row.channel,
    status: row.status,
    note: row.note,
    affiliateId: row.affiliateId,
    commissionAmount: Number(row.commissionAmount ?? 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toOrm(order: Order): OrderOrmEntity {
  const row = new OrderOrmEntity();
  row.id = order.id;
  row.reference = order.reference;
  row.storeId = order.storeId;
  row.buyerName = order.buyerName;
  row.buyerPhone = order.buyerPhone;
  row.items = order.items;
  row.total = order.total.toFixed(2);
  row.channel = order.channel;
  row.status = order.status;
  row.note = order.note;
  row.affiliateId = order.affiliateId;
  row.commissionAmount = order.commissionAmount.toFixed(2);
  row.createdAt = order.createdAt;
  row.updatedAt = order.updatedAt;
  return row;
}

export class TypeOrmOrderRepository implements OrderRepository {
  private readonly repo: Repository<OrderOrmEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(OrderOrmEntity);
  }

  async findByReference(reference: string): Promise<Order | null> {
    const row = await this.repo.findOne({ where: { reference } });
    return row ? toDomain(row) : null;
  }

  async save(order: Order): Promise<Order> {
    const saved = await this.repo.save(toOrm(order));
    return toDomain(saved);
  }
}
