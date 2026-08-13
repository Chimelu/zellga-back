import { Request, Response } from "express";
import { parseQuery } from "../../shared/http/http";
import { param } from "../../shared/http/params";
import {
  analyticsQueryValidator,
  orderListQueryValidator,
  userListQueryValidator,
} from "../validator";
import type { AdminService } from "../services/admin.service";
import type { UpdateOrderStatusDto } from "../dto/admin.dto";

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  listUsers = async (req: Request, res: Response): Promise<void> => {
    const query = parseQuery(userListQueryValidator, req.query);
    const data = await this.adminService.listUsers(query);
    res.status(200).json({ success: true, data });
  };

  getUser = async (req: Request, res: Response): Promise<void> => {
    const data = await this.adminService.getUser(param(req.params.id));
    res.status(200).json({ success: true, data });
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    await this.adminService.deleteUser(param(req.params.id));
    res.status(200).json({ success: true, data: { deleted: true } });
  };

  listOrders = async (req: Request, res: Response): Promise<void> => {
    const query = parseQuery(orderListQueryValidator, req.query);
    const data = await this.adminService.listOrders(query);
    res.status(200).json({ success: true, data });
  };

  getOrder = async (req: Request, res: Response): Promise<void> => {
    const data = await this.adminService.getOrder(param(req.params.id));
    res.status(200).json({ success: true, data });
  };

  updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateOrderStatusDto;
    const data = await this.adminService.updateOrderStatus(
      param(req.params.id),
      body
    );
    res.status(200).json({ success: true, data });
  };

  deleteOrder = async (req: Request, res: Response): Promise<void> => {
    await this.adminService.deleteOrder(param(req.params.id));
    res.status(200).json({ success: true, data: { deleted: true } });
  };

  analytics = async (req: Request, res: Response): Promise<void> => {
    const query = parseQuery(analyticsQueryValidator, req.query);
    const data = await this.adminService.analytics(query);
    res.status(200).json({ success: true, data });
  };
}
