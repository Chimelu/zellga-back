import type { z } from "zod";
import type {
  analyticsQueryValidator,
  orderListQueryValidator,
  updateOrderStatusValidator,
  userListQueryValidator,
} from "../validator";

export type UserListQueryDto = z.infer<typeof userListQueryValidator>;
export type OrderListQueryDto = z.infer<typeof orderListQueryValidator>;
export type AnalyticsQueryDto = z.infer<typeof analyticsQueryValidator>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusValidator>;
