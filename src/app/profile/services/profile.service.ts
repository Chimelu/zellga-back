import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../../core/errors/app.error";
import type { Store } from "../../../core/models/store.model";
import type { User } from "../../../core/models/user.model";
import type { ProductRepository } from "../../../core/repositories/product.repository";
import type { StoreRepository } from "../../../core/repositories/store.repository";
import type { UserRepository } from "../../../core/repositories/user.repository";
import type { PasswordHasher } from "../../../core/services/password-hasher";
import { normalizePhone, slugifyStoreName } from "../../../core/utils/identity";
import type {
  BusinessProfileDto,
  ChangePasswordDto,
  UpdateAccountDto,
  UpdateSettingsDto,
  UpdateStoreDetailsDto,
} from "../dto/profile.dto";

export class ProfileService {
  constructor(
    private readonly users: UserRepository,
    private readonly stores: StoreRepository,
    private readonly products: ProductRepository,
    private readonly hasher: PasswordHasher
  ) {}

  private async loadProfile(userId: string): Promise<{ user: User; store: Store }> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("Account not found");
    }
    const store = await this.stores.findByOwnerId(userId);
    if (!store) {
      throw new NotFoundError("Store not found for this account");
    }
    return { user, store };
  }

  private toDto(user: User, store: Store): BusinessProfileDto {
    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        category: store.category,
        description: store.description,
        link: `zellga.com/${store.slug}`,
      },
      settings: {
        defaultCheckoutMode: store.defaultCheckoutMode,
      },
    };
  }

  async getProfile(userId: string): Promise<BusinessProfileDto> {
    const { user, store } = await this.loadProfile(userId);
    return this.toDto(user, store);
  }

  async updateStore(
    userId: string,
    input: UpdateStoreDetailsDto
  ): Promise<BusinessProfileDto> {
    const { user, store } = await this.loadProfile(userId);

    if (input.name !== undefined) {
      store.name = input.name.trim();
    }

    if (input.slug !== undefined) {
      const nextSlug = slugifyStoreName(input.slug);
      if (nextSlug !== store.slug) {
        const taken = await this.stores.findBySlug(nextSlug);
        if (taken && taken.id !== store.id) {
          throw new ConflictError("That store link is already taken", "SLUG_TAKEN");
        }
        store.slug = nextSlug;
      }
    }

    if (input.category !== undefined) {
      store.category =
        input.category === null ? null : input.category.trim() || null;
    }

    if (input.description !== undefined) {
      store.description =
        input.description === null ? null : input.description.trim() || null;
    }

    store.updatedAt = new Date();
    const savedStore = await this.stores.save(store);
    return this.toDto(user, savedStore);
  }

  async updateAccount(
    userId: string,
    input: UpdateAccountDto
  ): Promise<BusinessProfileDto> {
    const { user, store } = await this.loadProfile(userId);

    if (input.name !== undefined) {
      user.name = input.name.trim();
    }

    if (input.phone !== undefined) {
      const phone = normalizePhone(input.phone);
      if (phone.length < 12) {
        throw new ValidationError("Enter a valid WhatsApp number");
      }
      if (phone !== user.phone) {
        const existing = await this.users.findByPhone(phone);
        if (existing && existing.id !== user.id) {
          throw new ConflictError(
            "Another account already uses this WhatsApp number",
            "PHONE_TAKEN"
          );
        }
        user.phone = phone;
      }
    }

    user.updatedAt = new Date();
    const savedUser = await this.users.save(user);
    return this.toDto(savedUser, store);
  }

  async updateSettings(
    userId: string,
    input: UpdateSettingsDto
  ): Promise<BusinessProfileDto> {
    const { user, store } = await this.loadProfile(userId);

    if (input.defaultCheckoutMode !== undefined) {
      store.defaultCheckoutMode = input.defaultCheckoutMode;

      // Keep every item on the same payment mode as the store setting
      const items = await this.products.findByStoreId(store.id);
      for (const product of items) {
        if (product.checkoutMode !== input.defaultCheckoutMode) {
          product.checkoutMode = input.defaultCheckoutMode;
          product.updatedAt = new Date();
          await this.products.save(product);
        }
      }
    }

    store.updatedAt = new Date();
    const savedStore = await this.stores.save(store);
    return this.toDto(user, savedStore);
  }

  async changePassword(
    userId: string,
    input: ChangePasswordDto
  ): Promise<{ updated: true }> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("Account not found");
    }

    const ok = await this.hasher.compare(
      input.currentPassword,
      user.passwordHash
    );
    if (!ok) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    user.passwordHash = await this.hasher.hash(input.newPassword);
    user.updatedAt = new Date();
    await this.users.save(user);

    return { updated: true };
  }
}
