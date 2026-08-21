import { randomUUID } from "crypto";
import { User } from "../../../core/models/user.model";
import { PasswordReset } from "../../../core/models/password-reset.model";
import { Store } from "../../../core/models/store.model";
import { Affiliate } from "../../../core/models/affiliate.model";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../../core/errors/app.error";
import type { UserRepository } from "../../../core/repositories/user.repository";
import type { StoreRepository } from "../../../core/repositories/store.repository";
import type {
  AffiliateInviteRepository,
  AffiliateRepository,
} from "../../../core/repositories/affiliate.repository";
import type { PasswordResetRepository } from "../../../core/repositories/password-reset.repository";
import type { Mailer } from "../../../core/services/mailer";
import type { PasswordHasher } from "../../../core/services/password-hasher";
import type { TokenService } from "../../../core/services/token.service";
import {
  normalizePhone,
  slugifyStoreName,
} from "../../../core/utils/identity";
import { generateRefCode } from "../../../core/utils/ref-code";
import {
  generateSecureToken,
  hashToken,
} from "../../../core/utils/secure-token";
import {
  passwordChangedEmail,
  passwordResetEmail,
} from "../../../infrastructure/email/templates/password-reset";
import type {
  AcceptInviteDto,
  AuthResponseDto,
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  InvitePreviewDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ResetTokenPreviewDto,
} from "../dto/auth.dto";

function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

/**
 * A person who has genuinely lost their password needs one or two links, not
 * ten. Anything past this in the window is dropped silently so the endpoint
 * cannot be used to flood someone's inbox.
 */
const RESET_REQUESTS_PER_WINDOW = 3;
const RESET_THROTTLE_WINDOW_MINUTES = 15;

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly stores: StoreRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly invites: AffiliateInviteRepository,
    private readonly affiliates: AffiliateRepository,
    private readonly resets: PasswordResetRepository,
    private readonly mailer: Mailer,
    /** Public web app the emailed reset link points back at. */
    private readonly appUrl: string,
    private readonly resetTtlMinutes: number
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

    const email = input.email?.trim().toLowerCase() || null;
    if (email && (await this.users.findByEmail(email))) {
      throw new ConflictError(
        "An account with this email already exists",
        "EMAIL_TAKEN"
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
      email,
      role: "seller",
      passwordHash: await this.hasher.hash(input.password),
      bankName: null,
      bankCode: null,
      bankAccountNumber: null,
      bankAccountName: null,
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
      logoUrl: null,
      coverUrl: null,
      defaultCheckoutMode: "whatsapp",
      affiliateCommissionPercent: 0,
      createdAt: now,
      updatedAt: now,
    });

    const savedStore = await this.stores.save(store);

    return this.authResponse(savedUser, savedStore);
  }

  async login(input: LoginDto): Promise<AuthResponseDto> {
    const identifier = input.identifier.trim();
    const user = looksLikeEmail(identifier)
      ? await this.users.findByEmail(identifier.toLowerCase())
      : await this.users.findByPhone(normalizePhone(identifier));

    // Same message either way so the response never reveals which accounts exist.
    const invalid = new UnauthorizedError("Invalid login details or password");
    if (!user) throw invalid;

    const ok = await this.hasher.compare(input.password, user.passwordHash);
    if (!ok) throw invalid;

    const store = await this.stores.findByOwnerId(user.id);
    return this.authResponse(user, store);
  }

  /**
   * Starts a password reset. The reply is the same whether or not the address
   * has an account, so the endpoint cannot be used to enumerate users; the
   * caller learns nothing beyond "we handled it".
   */
  async requestPasswordReset(
    input: ForgotPasswordDto
  ): Promise<ForgotPasswordResponseDto> {
    const acknowledged: ForgotPasswordResponseDto = {
      sent: true,
      message:
        "If an account exists for that email, a reset link is on its way.",
    };

    const email = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);
    if (!user || !user.email) return acknowledged;

    const now = new Date();
    const windowStart = new Date(
      now.getTime() - RESET_THROTTLE_WINDOW_MINUTES * 60 * 1000
    );
    // Throttled requests return the same acknowledgement rather than a 429 —
    // a distinguishable response here would give the enumeration away.
    const recent = await this.resets.countCreatedSince(user.id, windowStart);
    if (recent >= RESET_REQUESTS_PER_WINDOW) {
      console.warn(`Password reset throttled for user ${user.id}`);
      return acknowledged;
    }

    // Issuing a new link retires every earlier one, so only the latest works.
    await this.resets.invalidateAllForUser(user.id, now);

    const token = generateSecureToken();
    const reset = new PasswordReset({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(now.getTime() + this.resetTtlMinutes * 60 * 1000),
      usedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    const saved = await this.resets.save(reset);

    try {
      await this.mailer.send(
        passwordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl: `${this.appUrl}/reset-password?token=${token}`,
          expiresInMinutes: this.resetTtlMinutes,
        })
      );
    } catch (err) {
      // A link nobody received must not stay live. Surfacing the failure only
      // happens for real accounts, but a silent success would leave the owner
      // waiting on mail that is never coming.
      console.error("Failed to send password reset email", err);
      saved.usedAt = new Date();
      saved.updatedAt = saved.usedAt;
      await this.resets.save(saved);
      throw new ConflictError(
        "Could not send the reset email. Try again in a moment.",
        "EMAIL_SEND_FAILED"
      );
    }

    return acknowledged;
  }

  /** Lets the reset page show a dead link before asking for a new password. */
  async previewResetToken(token: string): Promise<ResetTokenPreviewDto> {
    const reset = await this.resets.findByTokenHash(hashToken(token));
    if (!reset) {
      throw new NotFoundError("This reset link is not valid", "RESET_INVALID");
    }

    const user = await this.users.findById(reset.userId);
    if (!user) {
      throw new NotFoundError("This reset link is not valid", "RESET_INVALID");
    }

    return {
      valid: reset.isUsable(),
      email: user.email ?? "",
      expiresAt: reset.expiresAt.toISOString(),
    };
  }

  /**
   * Redeems a reset link. The token proves control of the mailbox, so the
   * caller is signed in on success rather than being sent back to the login
   * form to type a password they only just chose.
   */
  async resetPassword(input: ResetPasswordDto): Promise<AuthResponseDto> {
    const reset = await this.resets.findByTokenHash(hashToken(input.token));
    if (!reset) {
      throw new NotFoundError("This reset link is not valid", "RESET_INVALID");
    }
    if (reset.usedAt) {
      throw new ConflictError(
        "This reset link has already been used",
        "RESET_USED"
      );
    }
    if (reset.isExpired()) {
      throw new ConflictError("This reset link has expired", "RESET_EXPIRED");
    }

    const user = await this.users.findById(reset.userId);
    if (!user) {
      throw new NotFoundError("This reset link is not valid", "RESET_INVALID");
    }

    const now = new Date();
    user.passwordHash = await this.hasher.hash(input.password);
    user.updatedAt = now;
    const savedUser = await this.users.save(user);

    reset.usedAt = now;
    reset.updatedAt = now;
    await this.resets.save(reset);
    // Anything else outstanding for this account dies with the reset too.
    await this.resets.invalidateAllForUser(user.id, now);

    // Best-effort: the password is already changed, and a failed notice must
    // not turn a successful reset into an error the caller has to retry.
    if (savedUser.email) {
      try {
        await this.mailer.send(
          passwordChangedEmail({
            to: savedUser.email,
            name: savedUser.name,
            supportUrl: `${this.appUrl}/forgot-password`,
          })
        );
      } catch (err) {
        console.error("Failed to send password changed notice", err);
      }
    }

    const store = await this.stores.findByOwnerId(savedUser.id);
    return this.authResponse(savedUser, store);
  }

  /** Powers the invite landing page before the recipient creates an account. */
  async previewInvite(token: string): Promise<InvitePreviewDto> {
    const invite = await this.invites.findByToken(token);
    if (!invite) {
      throw new NotFoundError("This invite link is not valid");
    }

    const store = await this.stores.findById(invite.storeId);
    if (!store) {
      throw new NotFoundError("The store for this invite no longer exists");
    }

    const owner = await this.users.findById(store.ownerId);
    const existingAccount = await this.users.findByEmail(invite.email);

    return {
      storeName: store.name,
      storeSlug: store.slug,
      inviterName: owner?.name ?? store.name,
      email: invite.email,
      commissionPercent: invite.commissionPercent,
      expiresAt: invite.expiresAt.toISOString(),
      acceptable: invite.isAcceptable(),
      hasAccount: Boolean(existingAccount),
    };
  }

  /**
   * Creates the affiliate's account from an invite and links them to the store
   * in one step. The email is taken from the invite, never from the request, so
   * a token cannot be redeemed against a different address.
   */
  async acceptInvite(input: AcceptInviteDto): Promise<AuthResponseDto> {
    const invite = await this.invites.findByToken(input.token);
    if (!invite) {
      throw new NotFoundError("This invite link is not valid");
    }
    if (invite.status === "accepted") {
      throw new ConflictError(
        "This invite has already been used",
        "INVITE_USED"
      );
    }
    if (invite.status === "revoked") {
      throw new ConflictError("This invite was withdrawn", "INVITE_REVOKED");
    }
    if (invite.isExpired()) {
      throw new ConflictError("This invite has expired", "INVITE_EXPIRED");
    }

    const store = await this.stores.findById(invite.storeId);
    if (!store) {
      throw new NotFoundError("The store for this invite no longer exists");
    }

    if (await this.users.findByEmail(invite.email)) {
      throw new ConflictError(
        "An account already exists for this email — log in to accept",
        "EMAIL_TAKEN"
      );
    }

    const phone = normalizePhone(input.phone);
    if (phone.length < 12) {
      throw new ValidationError("Enter a valid WhatsApp number");
    }
    if (await this.users.findByPhone(phone)) {
      throw new ConflictError(
        "An account with this WhatsApp number already exists",
        "PHONE_TAKEN"
      );
    }

    const now = new Date();
    const user = await this.users.save(
      new User({
        id: randomUUID(),
        name: input.name.trim(),
        phone,
        email: invite.email,
        role: "affiliate",
        passwordHash: await this.hasher.hash(input.password),
        bankName: null,
        bankCode: null,
        bankAccountNumber: null,
        bankAccountName: null,
        createdAt: now,
        updatedAt: now,
      })
    );

    await this.affiliates.save(
      new Affiliate({
        id: randomUUID(),
        storeId: store.id,
        userId: user.id,
        refCode: await this.uniqueRefCode(),
        status: "active",
        commissionPercent: invite.commissionPercent,
        createdAt: now,
        updatedAt: now,
      })
    );

    invite.status = "accepted";
    invite.acceptedAt = now;
    invite.updatedAt = now;
    await this.invites.save(invite);

    // Affiliates own no store; their dashboard is driven by their affiliations.
    return this.authResponse(user, null);
  }

  private async uniqueRefCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = generateRefCode();
      if (!(await this.affiliates.refCodeExists(code))) return code;
    }
    throw new Error("Could not allocate a unique affiliate ref code");
  }

  private authResponse(user: User, store: Store | null): AuthResponseDto {
    return {
      token: this.tokens.sign({ sub: user.id, phone: user.phone }),
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
          }
        : null,
    };
  }
}
