import { CloudinaryImageStorage } from "../../infrastructure/storage/cloudinary-image.storage";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";
import { UploadsController } from "./controller/uploads.controller";
import { createUploadsRouter } from "./uploads.routes";
import { UploadsService } from "./services/uploads.service";

export function buildUploadsModule() {
  const images = new CloudinaryImageStorage();
  const tokens = new JwtTokenService();
  const service = new UploadsService(images);
  const controller = new UploadsController(service);

  return {
    router: createUploadsRouter(controller, tokens),
  };
}
