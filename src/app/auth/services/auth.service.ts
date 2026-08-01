import { randomUUID } from "crypto";
import { User } from "../../../core/models/user.model";
import { Store } from "../../../core/models/store.model";
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from "../../../core/errors/app.error";
import type { UserRepository } from "../../../core/repositories/user.repository";
import type { StoreRepository } from "../../../core/repositories/store.repository";
import type { PasswordHasher } from "../../../core/services/password-hasher";
import type { TokenService } from "../../../core/services/token.service";
import {
  normalizePhone,
  slugifyStoreName,
} from "../../../core/utils/identity";
import type {
  AuthResponseDto,
  LoginDto,
  RegisterDto,
} from "../dto/auth.dto";

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly stores: StoreRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService
  ) {}

  async register(input: RegisterDto): Promise<AuthResponseDto> {
    const phone = normalizePhone(input.phone);
    if (phone.length < 12) {
      throw new ValidationError("Enter a valid WhatsApp number");
    }

    const existing = await this.users.findByPhone(phone);
    if (existing) {
      throw new ConflictError(
        "An account with this WhatsApp number already exists",
        "PHONE_TAKEN"
      );
    }

    let slug = slugifyStoreName(input.storeName);
    const slugTaken = await this.stores.findBySlug(slug);
    if (slugTaken) {
      slug = `${slug}-${randomUUID().slice(0, 6)}`;
    }

    const now = new Date();
    const user = new User({
      id: randomUUID(),
      name: input.name.trim(),
      phone,
      passwordHash: await this.hasher.hash(input.password),
      createdAt: now,
      updatedAt: now,
    });

    const savedUser = await this.users.save(user);

    const store = new Store({
      id: randomUUID(),
      ownerId: savedUser.id,
      name: input.storeName.trim(),
      slug,
      category: input.category?.trim() || null,
      description: null,
      defaultCheckoutMode: "whatsapp",
      createdAt: now,
      updatedAt: now,
    });

    const savedStore = await this.stores.save(store);

    return {
      token: this.tokens.sign({
        sub: savedUser.id,
        phone: savedUser.phone,
      }),
      user: {
        id: savedUser.id,
        name: savedUser.name,
        phone: savedUser.phone,
      },
      store: {
        id: savedStore.id,
        name: savedStore.name,
        slug: savedStore.slug,
        category: savedStore.category,
      },
    };
  }

  async login(input: LoginDto): Promise<AuthResponseDto> {
    const phone = normalizePhone(input.phone);
    const user = await this.users.findByPhone(phone);

    if (!user) {
      throw new UnauthorizedError("Invalid WhatsApp number or password");
    }

    const ok = await this.hasher.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError("Invalid WhatsApp number or password");
    }

    const store = await this.stores.findByOwnerId(user.id);

    return {
      token: this.tokens.sign({ sub: user.id, phone: user.phone }),
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
      store: store
        ? {
            id: store.id,
            name: store.name,
            slug: store.slug,
            category: store.category,
          }
        : null,
    };
  }
}
