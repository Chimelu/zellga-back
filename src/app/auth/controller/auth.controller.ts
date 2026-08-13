import { Request, Response } from "express";
import type { AuthService } from "../services/auth.service";
import type {
  AcceptInviteDto,
  LoginDto,
  RegisterDto,
} from "../dto/auth.dto";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as RegisterDto;
    const data = await this.authService.register(body);
    res.status(201).json({ success: true, data });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as LoginDto;
    const data = await this.authService.login(body);
    res.status(200).json({ success: true, data });
  };

  previewInvite = async (req: Request, res: Response): Promise<void> => {
    const data = await this.authService.previewInvite(String(req.params.token));
    res.status(200).json({ success: true, data });
  };

  acceptInvite = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as AcceptInviteDto;
    const data = await this.authService.acceptInvite(body);
    res.status(201).json({ success: true, data });
  };
}
