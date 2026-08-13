import type { Mailer, MailMessage } from "../../core/services/mailer";

/**
 * Development fallback used when no SMTP host is configured. It prints the
 * message so invite links can be followed locally without mail credentials.
 */
export class ConsoleMailer implements Mailer {
  async send(message: MailMessage): Promise<void> {
    console.log(
      [
        "",
        "──────────── EMAIL (not sent — no SMTP configured) ────────────",
        `To:      ${message.to}`,
        `Subject: ${message.subject}`,
        "",
        message.text,
        "───────────────────────────────────────────────────────────────",
        "",
      ].join("\n")
    );
  }
}
