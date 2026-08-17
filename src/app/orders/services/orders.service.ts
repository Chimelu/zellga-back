import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../core/errors/app.error";
import type { Order } from "../../../core/models/order.model";
import type { OrderRepository } from "../../../core/repositories/order.repository";
import type { StoreRepository } from "../../../core/repositories/store.repository";
import type {
  SellerOrderDto,
  SellerOrderListDto,
  SellerOrderListQueryDto,
  SellerOrderSummaryDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from "../dto/order.dto";

export class OrdersService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly stores: StoreRepository
  ) {}

  /**
   * Every read is scoped through the caller's own store, so an order id from
   * another seller resolves to a 404 rather than leaking a buyer's details.
   */
  private async requireOwnedStore(userId: string) {
    const store = await this.stores.findByOwnerId(userId);
    if (!store) {
      throw new ForbiddenError("Only a store owner can view orders");
    }
    return store;
  }

  private toDto(order: Order): SellerOrderDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      reference: order.reference,
      buyerName: order.buyerName,
      buyerPhone: order.buyerPhone,
      buyerEmail: order.buyerEmail,
      items: order.items,
      itemCount: order.itemCount,
      total: order.total,
      channel: order.channel,
      status: order.status,
      note: order.note,
      payment: {
        status: order.paymentStatus,
        provider: order.paymentProvider,
        reference: order.paymentReference,
        channel: order.paymentChannel,
        amountPaid: order.amountPaid,
        paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      },
      affiliateId: order.affiliateId,
      commissionAmount: order.commissionAmount,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  async list(
    userId: string,
    query: SellerOrderListQueryDto
  ): Promise<SellerOrderListDto> {
    const store = await this.requireOwnedStore(userId);
    const page = await this.orders.listByStore(store.id, query);

    return {
      items: page.items.map((order) => this.toDto(order)),
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
      pageCount: page.pageCount,
    };
  }

  async summary(userId: string): Promise<SellerOrderSummaryDto> {
    const store = await this.requireOwnedStore(userId);
    return this.orders.summaryByStore(store.id);
  }

  async getOne(userId: string, orderId: string): Promise<SellerOrderDto> {
    const store = await this.requireOwnedStore(userId);
    const order = await this.orders.findById(orderId);

    if (!order || order.storeId !== store.id) {
      throw new NotFoundError("Order not found", "ORDER_NOT_FOUND");
    }
    return this.toDto(order);
  }

  private async requireOrder(userId: string, orderId: string) {
    const store = await this.requireOwnedStore(userId);
    const order = await this.orders.findById(orderId);

    if (!order || order.storeId !== store.id) {
      throw new NotFoundError("Order not found", "ORDER_NOT_FOUND");
    }
    return order;
  }

  /**
   * Moves the order along the seller's workflow. Any transition is allowed —
   * a real conversation does not follow one path, and blocking a correction
   * would just leave the dashboard wrong.
   */
  async updateStatus(
    userId: string,
    orderId: string,
    input: UpdateOrderStatusDto
  ): Promise<SellerOrderDto> {
    const order = await this.requireOrder(userId, orderId);

    order.status = input.status;
    order.updatedAt = new Date();
    const saved = await this.orders.save(order);
    return this.toDto(saved);
  }

  /**
   * Records money that arrived outside the platform — a WhatsApp transfer or
   * cash on delivery.
   *
   * Online orders are refused outright, whether or not a payment attempt has
   * started: their status belongs to the Paystack webhook alone. Allowing a
   * seller to mark one paid would let unpaid stock ship on a mistaken click,
   * and would put the dashboard at odds with what Paystack actually settled.
   */
  async updatePaymentStatus(
    userId: string,
    orderId: string,
    input: UpdatePaymentStatusDto
  ): Promise<SellerOrderDto> {
    const order = await this.requireOrder(userId, orderId);

    if (order.channel !== "whatsapp") {
      throw new ValidationError(
        "Online payments are confirmed by Paystack automatically and cannot be set by hand"
      );
    }

    if (input.paymentStatus === "paid") {
      order.markPaidManually(input.amountPaid);
    } else if (input.paymentStatus === "refunded") {
      if (!order.markRefunded()) {
        throw new ValidationError("Only a paid order can be refunded");
      }
    } else {
      // Undoing a mistaken confirmation.
      order.paymentStatus = "unpaid";
      order.amountPaid = 0;
      order.paidAt = null;
      order.updatedAt = new Date();
    }

    const saved = await this.orders.save(order);
    return this.toDto(saved);
  }
}
