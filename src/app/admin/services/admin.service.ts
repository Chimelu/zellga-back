import { NotFoundError } from "../../../core/errors/app.error";
import type {
  AdminAnalytics,
  AdminOrderRow,
  AdminRepository,
  AdminUserRow,
  Paginated,
} from "../../../core/repositories/admin.repository";
import type {
  AnalyticsQueryDto,
  OrderListQueryDto,
  UpdateOrderStatusDto,
  UserListQueryDto,
} from "../dto/admin.dto";

export class AdminService {
  constructor(private readonly admin: AdminRepository) {}

  listUsers(query: UserListQueryDto): Promise<Paginated<AdminUserRow>> {
    return this.admin.listUsers(query);
  }

  async getUser(id: string): Promise<AdminUserRow> {
    const user = await this.admin.findUserById(id);
    if (!user) throw new NotFoundError("User not found", "USER_NOT_FOUND");
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUser(id);
    await this.admin.deleteUser(id);
  }

  listOrders(query: OrderListQueryDto): Promise<Paginated<AdminOrderRow>> {
    return this.admin.listOrders(query);
  }

  async getOrder(id: string): Promise<AdminOrderRow> {
    const order = await this.admin.findOrderById(id);
    if (!order) throw new NotFoundError("Order not found", "ORDER_NOT_FOUND");
    return order;
  }

  async updateOrderStatus(
    id: string,
    dto: UpdateOrderStatusDto
  ): Promise<AdminOrderRow> {
    const updated = await this.admin.updateOrderStatus(id, dto.status);
    if (!updated) throw new NotFoundError("Order not found", "ORDER_NOT_FOUND");
    return updated;
  }

  async deleteOrder(id: string): Promise<void> {
    await this.getOrder(id);
    await this.admin.deleteOrder(id);
  }

  analytics(query: AnalyticsQueryDto): Promise<AdminAnalytics> {
    return this.admin.analytics(query.days);
  }
}
