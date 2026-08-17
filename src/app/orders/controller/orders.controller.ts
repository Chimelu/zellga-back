import { Request, Response } from "express";
import { parseQuery } from "../../shared/http/http";
import { param } from "../../shared/http/params";
import type { OrdersService } from "../services/orders.service";
import { orderListQueryValidator } from "../validator";
import type {
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from "../dto/order.dto";

export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const query = parseQuery(orderListQueryValidator, req.query);
    const data = await this.orders.list(req.user!.id, query);
    res.status(200).json({ success: true, data });
  };

  summary = async (req: Request, res: Response): Promise<void> => {
    const data = await this.orders.summary(req.user!.id);
    res.status(200).json({ success: true, data });
  };

  getOne = async (req: Request, res: Response): Promise<void> => {
    const data = await this.orders.getOne(req.user!.id, param(req.params.id));
    res.status(200).json({ success: true, data });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateOrderStatusDto;
    const data = await this.orders.updateStatus(
      req.user!.id,
      param(req.params.id),
      body
    );
    res.status(200).json({ success: true, data });
  };

  updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdatePaymentStatusDto;
    const data = await this.orders.updatePaymentStatus(
      req.user!.id,
      param(req.params.id),
      body
    );
    res.status(200).json({ success: true, data });
  };
}
