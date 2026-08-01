import { Request, Response } from "express";
import type { UploadsService } from "../services/uploads.service";

function getFiles(req: Request): Express.Multer.File[] {
  if (Array.isArray(req.files)) return req.files;
  if (req.file) return [req.file];
  return [];
}

export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  upload = async (req: Request, res: Response): Promise<void> => {
    const files = getFiles(req);
    const folder =
      typeof req.body?.folder === "string" ? req.body.folder : undefined;

    if (files.length <= 1) {
      const data = await this.uploadsService.uploadOne(files[0], folder);
      res.status(201).json({ success: true, data });
      return;
    }

    const data = await this.uploadsService.uploadMany(files, folder);
    res.status(201).json({ success: true, data });
  };
}
