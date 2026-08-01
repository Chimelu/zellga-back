import { Request, Response } from "express";
import { param } from "../../shared/http/params";
import type { ProductsService } from "../services/products.service";
import type {
  CreateProductDto,
  SetProductVisibilityDto,
  UpdateProductDto,
} from "../dto/product.dto";

export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const data = await this.productsService.listMine(req.user!.id);
    res.status(200).json({ success: true, data });
  };

  getOne = async (req: Request, res: Response): Promise<void> => {
    const data = await this.productsService.getMine(
      req.user!.id,
      param(req.params.id)
    );
    res.status(200).json({ success: true, data });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateProductDto;
    const data = await this.productsService.create(req.user!.id, body);
    res.status(201).json({ success: true, data });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateProductDto;
    const data = await this.productsService.update(
      req.user!.id,
      param(req.params.id),
      body
    );
    res.status(200).json({ success: true, data });
  };

  setVisibility = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as SetProductVisibilityDto;
    const data = await this.productsService.setVisibility(
      req.user!.id,
      param(req.params.id),
      body
    );
    res.status(200).json({ success: true, data });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.productsService.remove(req.user!.id, param(req.params.id));
    res.status(200).json({ success: true, data: { deleted: true } });
  };
}
