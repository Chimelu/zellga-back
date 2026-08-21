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
  UpdatePayoutDto,
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

  /**
   * Affiliates own no store, so the store side is optional here — they read
   * and write this profile for their payout account just like a seller does.
   */
  private async loadProfile(
    userId: string
  ): Promise<{ user: User; store: Store | null }> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("Account not found");
    }
    const store = await this.stores.findByOwnerId(userId);
    return { user, store };
  }

  /** For the routes that only a store owner can use. */
  private async loadStoreProfile(
    userId: string
  ): Promise<{ user: User; store: Store }> {
    const { user, store } = await this.loadProfile(userId);
    if (!store) {
      throw new NotFoundError("Store not found for this account");
    }
    return { user, store };
  }

  private toDto(user: User, store: Store | null): BusinessProfileDto {
    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
      store: store
        ? {
            id: store.id,
            name: store.name,
            slug: store.slug,
            category: store.category,
            description: store.description,
            logoUrl: store.logoUrl,
            coverUrl: store.coverUrl,
            link: `zellga.com/${store.slug}`,
          }
        : null,
      payout: {
        bankName: user.bankName,
        bankCode: user.bankCode,
        accountNumber: user.bankAccountNumber,
        accountName: user.bankAccountName,
        complete: user.hasPayoutAccount,
      },
      settings: store
        ? {
            defaultCheckoutMode: store.defaultCheckoutMode,
            affiliateCommissionPercent: store.affiliateCommissionPercent,
          }
        : null,
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
    const { user, store } = await this.loadStoreProfile(userId);

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

    if (input.logoUrl !== undefined) {
      store.logoUrl = input.logoUrl?.trim() || null;
    }

    if (input.coverUrl !== undefined) {
      store.coverUrl = input.coverUrl?.trim() || null;
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

    if (input.email !== undefined) {
      const email = input.email === null ? null : input.email.trim().toLowerCase();
      if (email && email !== user.email) {
        const existing = await this.users.findByEmail(email);
        if (existing && existing.id !== user.id) {
          throw new ConflictError(
            "Another account already uses this email",
            "EMAIL_TAKEN"
          );
        }
      }
      user.email = email || null;
    }

    user.updatedAt = new Date();
    const savedUser = await this.users.save(user);
    return this.toDto(savedUser, store);
  }

  /**
   * Bank fields are independent: sending one leaves the others untouched, and
   * an empty string clears a field rather than storing "".
   */
  async updatePayout(
    userId: string,
    input: UpdatePayoutDto
  ): Promise<BusinessProfileDto> {
    const { user, store } = await this.loadProfile(userId);

    if (input.bankName !== undefined) {
      user.bankName = input.bankName?.trim() || null;
    }
    if (input.bankCode !== undefined) {
      user.bankCode = input.bankCode?.trim() || null;
    }
    if (input.accountNumber !== undefined) {
      user.bankAccountNumber = input.accountNumber?.trim() || null;
    }
    if (input.accountName !== undefined) {
      user.bankAccountName = input.accountName?.trim() || null;
    }

    user.updatedAt = new Date();
    const savedUser = await this.users.save(user);
    return this.toDto(savedUser, store);
  }

  async updateSettings(
    userId: string,
    input: UpdateSettingsDto
  ): Promise<BusinessProfileDto> {
    const { user, store } = await this.loadStoreProfile(userId);

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

    if (input.affiliateCommissionPercent !== undefined) {
      store.affiliateCommissionPercent = input.affiliateCommissionPercent;
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
