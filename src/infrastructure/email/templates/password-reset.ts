import type { MailMessage } from "../../../core/services/mailer";
import { escapeHtml } from "./escape-html";

export type PasswordResetEmailInput = {
  to: string;
  /** Account holder's name, so the mail reads as addressed to a person. */
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export function passwordResetEmail(input: PasswordResetEmailInput): MailMessage {
  const name = escapeHtml(input.name);
  const url = escapeHtml(input.resetUrl);
  const minutes = input.expiresInMinutes;

  const text = [
    `Hi ${input.name},`,
    "",
    "We got a request to reset the password on your Zellga account.",
    "",
    "Reset your password:",
    input.resetUrl,
    "",
    `This link expires in ${minutes} minutes and can only be used once.`,
    "If you didn't ask for this, ignore this email — your password stays as it is.",
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f8f7ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#081a51;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6d3df5;">Zellga</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">Reset your password</h1>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:rgba(8,26,81,0.75);">
        Hi ${name}, we got a request to reset the password on your Zellga
        account. Tap the button below to choose a new one.
      </p>

      <a href="${url}"
         style="display:inline-block;background:#6d3df5;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:14px;">
        Reset my password
      </a>

      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:rgba(8,26,81,0.5);">
        This link expires in ${minutes} minutes and can only be used once. If
        the button doesn't work, copy this link into your browser:<br />
        <span style="color:#6d3df5;word-break:break-all;">${url}</span>
      </p>

      <p style="margin:16px 0 0;font-size:13px;color:rgba(8,26,81,0.5);">
        Didn't ask for this? Ignore this email — your password stays as it is.
      </p>
    </div>
  </body>
</html>`;

  return {
    to: input.to,
    subject: "Reset your Zellga password",
    html,
    text,
  };
}

export type PasswordChangedEmailInput = {
  to: string;
  name: string;
  /** Where to go if the change was not theirs. */
  supportUrl: string;
};

/**
 * Sent after a successful reset. It is the only signal an account owner gets
 * that someone used a reset link, so it is worth the extra message.
 */
export function passwordChangedEmail(
  input: PasswordChangedEmailInput
): MailMessage {
  const name = escapeHtml(input.name);
  const support = escapeHtml(input.supportUrl);

  const text = [
    `Hi ${input.name},`,
    "",
    "Your Zellga password was just changed.",
    "",
    "If that was you, nothing else to do — log in with your new password.",
    `If it wasn't, reset your password again straight away: ${input.supportUrl}`,
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f8f7ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#081a51;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6d3df5;">Zellga</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">Your password was changed</h1>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:rgba(8,26,81,0.75);">
        Hi ${name}, your Zellga password was just changed. If that was you,
        there's nothing else to do — log in with your new password.
      </p>

      <p style="margin:0;font-size:15px;line-height:1.6;color:rgba(8,26,81,0.75);">
        If it wasn't you,
        <a href="${support}" style="color:#6d3df5;font-weight:700;">reset your password</a>
        straight away.
      </p>
    </div>
  </body>
</html>`;

  return {
    to: input.to,
    subject: "Your Zellga password was changed",
    html,
    text,
  };
}
