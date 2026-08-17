import { Request, Response } from "express";
import { parseQuery } from "../../shared/http/http";
import { param } from "../../shared/http/params";
import type { PaymentsService } from "../services/payments.service";
import type { InitializePaymentDto } from "../dto/payment.dto";
import { resolveAccountValidator } from "../validator";

const PAYSTACK_SIGNATURE_HEADER = "x-paystack-signature";

export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  initialize = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as InitializePaymentDto;
    const data = await this.payments.initialize(body);
    res.status(201).json({ success: true, data });
  };

  verify = async (req: Request, res: Response): Promise<void> => {
    const data = await this.payments.verify(param(req.params.reference));
    res.status(200).json({ success: true, data });
  };

  getOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const data = await this.payments.getOrderPaymentStatus(
      param(req.params.orderId)
    );
    res.status(200).json({ success: true, data });
  };

  listBanks = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.payments.listBanks();
    res.status(200).json({ success: true, data });
  };

  resolveAccount = async (req: Request, res: Response): Promise<void> => {
    const { accountNumber, bankCode } = parseQuery(
      resolveAccountValidator,
      req.query
    );
    const data = await this.payments.resolveAccount(accountNumber, bankCode);
    res.status(200).json({ success: true, data });
  };

  /**
   * Paystack retries until it gets a 2xx, so anything we successfully handled
   * — including events for orders we do not recognise — answers 200. A thrown
   * error deliberately surfaces as 5xx to earn a retry.
   */
  webhook = async (req: Request, res: Response): Promise<void> => {
    const signature = req.get(PAYSTACK_SIGNATURE_HEADER) ?? undefined;
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));

    const data = await this.payments.handleWebhook(rawBody, signature);
    res.status(200).json({ success: true, data });
  };
}
