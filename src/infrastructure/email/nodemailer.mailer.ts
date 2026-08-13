import nodemailer, { type Transporter } from "nodemailer";
import type { Mailer, MailMessage } from "../../core/services/mailer";
import { env } from "../config/env";
import { ConsoleMailer } from "./console.mailer";

export type SmtpOptions = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
};

export class NodemailerMailer implements Mailer {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(options: SmtpOptions) {
    this.from = options.from;
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth:
        options.user && options.pass
          ? { user: options.user, pass: options.pass }
          : undefined,
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}

/**
 * Picks the transport from the environment. Callers depend on the `Mailer`
 * port, so swapping providers never reaches past this function.
 */
export function createMailer(): Mailer {
  if (!env.SMTP_HOST) {
    console.warn(
      "SMTP_HOST is not set — email will be logged to the console instead of sent."
    );
    return new ConsoleMailer();
  }

  return new NodemailerMailer({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.MAIL_FROM,
  });
}
