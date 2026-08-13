import type { MailMessage } from "../../../core/services/mailer";

export type AffiliateInviteEmailInput = {
  to: string;
  /** Store the affiliate is being invited to sell for. */
  storeName: string;
  /** Person sending the invite, shown so the recipient recognises them. */
  inviterName: string;
  commissionPercent: number;
  acceptUrl: string;
  expiresInDays: number;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function affiliateInviteEmail(
  input: AffiliateInviteEmailInput
): MailMessage {
  const store = escapeHtml(input.storeName);
  const inviter = escapeHtml(input.inviterName);
  const rate = input.commissionPercent;

  const text = [
    `${input.inviterName} has invited you to sell for ${input.storeName} on Zellga.`,
    "",
    `You earn ${rate}% of every order you bring in.`,
    "",
    "How it works:",
    `  1. Accept the invite and create your account.`,
    `  2. Get your own sharing link for ${input.storeName}.`,
    `  3. Share it. Every order through your link is tracked and credited to you.`,
    "",
    "Accept your invite:",
    input.acceptUrl,
    "",
    `This invite expires in ${input.expiresInDays} days.`,
    "If you weren't expecting this, you can ignore this email.",
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f8f7ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#081a51;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6d3df5;">Zellga</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">
        ${inviter} invited you to sell for ${store}
      </h1>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:rgba(8,26,81,0.75);">
        You've been invited to earn commission selling ${store}'s products on
        Zellga. You earn <strong style="color:#081a51;">${rate}%</strong> of
        every order you bring in.
      </p>

      <ol style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.8;color:rgba(8,26,81,0.75);">
        <li>Accept the invite and create your account.</li>
        <li>Get your own sharing link for ${store}.</li>
        <li>Share it — every order through your link is credited to you.</li>
      </ol>

      <a href="${input.acceptUrl}"
         style="display:inline-block;background:#6d3df5;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:14px;">
        Accept invite &amp; get started
      </a>

      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:rgba(8,26,81,0.5);">
        This invite expires in ${input.expiresInDays} days. If the button
        doesn't work, copy this link into your browser:<br />
        <span style="color:#6d3df5;word-break:break-all;">${input.acceptUrl}</span>
      </p>

      <p style="margin:16px 0 0;font-size:13px;color:rgba(8,26,81,0.5);">
        If you weren't expecting this, you can safely ignore this email.
      </p>
    </div>
  </body>
</html>`;

  return {
    to: input.to,
    subject: `${input.inviterName} invited you to sell for ${input.storeName}`,
    html,
    text,
  };
}
