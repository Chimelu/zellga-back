import type { z } from "zod";
import type {
  adminLoginValidator,
  analyticsQueryValidator,
  orderListQueryValidator,
  updateOrderStatusValidator,
  userListQueryValidator,
} from "../validator";

export type UserListQueryDto = z.infer<typeof userListQueryValidator>;
export type OrderListQueryDto = z.infer<typeof orderListQueryValidator>;
export type AnalyticsQueryDto = z.infer<typeof analyticsQueryValidator>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusValidator>;
export type AdminLoginDto = z.infer<typeof adminLoginValidator>;
