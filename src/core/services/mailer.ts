export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative for clients that will not render HTML. */
  text: string;
};

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}
