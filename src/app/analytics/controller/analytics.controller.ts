import { Request, Response } from "express";
import { parseQuery } from "../../shared/http/http";
import type { AnalyticsService } from "../services/analytics.service";
import { analyticsQueryValidator } from "../validator";
import type { RecordEventDto } from "../dto/analytics.dto";

export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /**
   * Fire-and-forget beacon from the storefront. Always answers 202 — the buyer
   * gains nothing from an error, and a tracking failure must never look like a
   * broken page.
   */
  recordEvent = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as RecordEventDto;
    const data = await this.analytics.recordEvent(body);
    res.status(202).json({ success: true, data });
  };

  getVendorAnalytics = async (req: Request, res: Response): Promise<void> => {
    const { days } = parseQuery(analyticsQueryValidator, req.query);
    const data = await this.analytics.getVendorAnalytics(req.user!.id, days);
    res.status(200).json({ success: true, data });
  };
}
