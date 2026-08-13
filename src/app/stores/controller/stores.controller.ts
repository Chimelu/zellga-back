import { Request, Response } from "express";
import { param } from "../../shared/http/params";
import type { StoresService } from "../services/stores.service";
import type { CreateOrderDto } from "../dto/store.dto";

export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    const data = await this.storesService.getPublicBySlug(param(req.params.slug));
    res.status(200).json({ success: true, data });
  };

  createOrder = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateOrderDto;
    const data = await this.storesService.createOrder(
      param(req.params.slug),
      body
    );
    res.status(201).json({ success: true, data });
  };
}
