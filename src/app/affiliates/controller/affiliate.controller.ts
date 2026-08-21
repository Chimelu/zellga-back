import { Request, Response } from "express";
import { parseQuery } from "../../shared/http/http";
import type { AffiliateService } from "../services/affiliate.service";
import type { InviteAffiliateDto } from "../dto/affiliate.dto";
import {
  affiliateProductsQueryValidator,
  salesQueryValidator,
} from "../validator";

export class AffiliateController {
  constructor(private readonly service: AffiliateService) {}

  // ── Seller side ──
  getProgram = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.getProgram(req.user!.id);
    res.status(200).json({ success: true, data });
  };

  invite = async (req: Request, res: Response): Promise<void> => {
    // The validator normalises `email` and `emails` down to one list.
    const body = req.body as InviteAffiliateDto;
    const data = await this.service.inviteMany(req.user!.id, body.emails);
    res.status(201).json({ success: true, data });
  };

  revokeInvite = async (req: Request, res: Response): Promise<void> => {
    await this.service.revokeInvite(req.user!.id, String(req.params.inviteId));
    res.status(200).json({ success: true, data: { revoked: true } });
  };

  setStatus = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as { status: "active" | "suspended" };
    await this.service.setAffiliateStatus(
      req.user!.id,
      String(req.params.affiliateId),
      body.status
    );
    res.status(200).json({ success: true, data: { updated: true } });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.service.removeAffiliate(
      req.user!.id,
      String(req.params.affiliateId)
    );
    res.status(200).json({ success: true, data: { removed: true } });
  };

  // ── Affiliate side ──
  getDashboard = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.getDashboard(req.user!.id);
    res.status(200).json({ success: true, data });
  };

  listProducts = async (req: Request, res: Response): Promise<void> => {
    const query = parseQuery(affiliateProductsQueryValidator, req.query);
    const data = await this.service.listProducts(req.user!.id, query.storeId);
    res.status(200).json({ success: true, data });
  };

  listSales = async (req: Request, res: Response): Promise<void> => {
    const query = parseQuery(salesQueryValidator, req.query);
    const data = await this.service.listSales(
      req.user!.id,
      query.page,
      query.pageSize
    );
    res.status(200).json({ success: true, data });
  };
}
