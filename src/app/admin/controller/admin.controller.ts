import { Request, Response } from "express";
import { parseQuery } from "../../shared/http/http";
import { param } from "../../shared/http/params";
import {
  analyticsQueryValidator,
  orderListQueryValidator,
  userListQueryValidator,
} from "../validator";
import { UnauthorizedError } from "../../../core/errors/app.error";
import type { AdminService } from "../services/admin.service";
import type { AdminAuthService } from "../services/admin-auth.service";
import type { AdminLoginDto, UpdateOrderStatusDto } from "../dto/admin.dto";

export class AdminController {
  constructor(
    private readonly liveService: AdminService,
    private readonly demoService: AdminService,
    private readonly authService: AdminAuthService
  ) {}

  /** Demo admins get the generated dataset; only real admins reach the database. */
  private service(req: Request): AdminService {
    if (!req.admin) throw new UnauthorizedError("Admin login required");
    return req.admin.demo ? this.demoService : this.liveService;
  }

  login = async (req: Request, res: Response): Promise<void> => {
    const data = await this.authService.login(req.body as AdminLoginDto);
    res.status(200).json({ success: true, data });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.admin) throw new UnauthorizedError("Admin login required");
    const data = await this.authService.me(req.admin.id);
    res.status(200).json({ success: true, data });
  };

  listUsers = async (req: Request, res: Response): Promise<void> => {
    const query = parseQuery(userListQueryValidator, req.query);
    const data = await this.service(req).listUsers(query);
    res.status(200).json({ success: true, data });
  };

  getUser = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service(req).getUser(param(req.params.id));
    res.status(200).json({ success: true, data });
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    await this.service(req).deleteUser(param(req.params.id));
    res.status(200).json({ success: true, data: { deleted: true } });
  };

  listOrders = async (req: Request, res: Response): Promise<void> => {
    const query = parseQuery(orderListQueryValidator, req.query);
    const data = await this.service(req).listOrders(query);
    res.status(200).json({ success: true, data });
  };

  getOrder = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service(req).getOrder(param(req.params.id));
    res.status(200).json({ success: true, data });
  };

  updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateOrderStatusDto;
    const data = await this.service(req).updateOrderStatus(
      param(req.params.id),
      body
    );
    res.status(200).json({ success: true, data });
  };

  deleteOrder = async (req: Request, res: Response): Promise<void> => {
    await this.service(req).deleteOrder(param(req.params.id));
    res.status(200).json({ success: true, data: { deleted: true } });
  };

  analytics = async (req: Request, res: Response): Promise<void> => {
    const query = parseQuery(analyticsQueryValidator, req.query);
    const data = await this.service(req).analytics(query);
    res.status(200).json({ success: true, data });
  };
}
