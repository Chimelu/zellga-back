import { Request, Response } from "express";
import type { ProfileService } from "../services/profile.service";
import type {
  ChangePasswordDto,
  UpdateAccountDto,
  UpdateSettingsDto,
  UpdateStoreDetailsDto,
} from "../dto/profile.dto";

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  get = async (req: Request, res: Response): Promise<void> => {
    const data = await this.profileService.getProfile(req.user!.id);
    res.status(200).json({ success: true, data });
  };

  updateStore = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateStoreDetailsDto;
    const data = await this.profileService.updateStore(req.user!.id, body);
    res.status(200).json({ success: true, data });
  };

  updateAccount = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateAccountDto;
    const data = await this.profileService.updateAccount(req.user!.id, body);
    res.status(200).json({ success: true, data });
  };

  updateSettings = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateSettingsDto;
    const data = await this.profileService.updateSettings(req.user!.id, body);
    res.status(200).json({ success: true, data });
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as ChangePasswordDto;
    const data = await this.profileService.changePassword(req.user!.id, body);
    res.status(200).json({ success: true, data });
  };
}
