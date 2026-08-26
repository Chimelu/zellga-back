import type { MailMessage } from "../../../core/services/mailer";
import { escapeHtml } from "./escape-html";

export type OrderEmailLine = {
  name: string;
  quantity: number;
  /** Unit price, so the line total is quantity × this. */
  price: number;
};

/** A digital item the buyer now has access to, with the links that grant it. */
export type OrderEmailAccess = {
  name: string;
  fileUrl: string | null;
  fileName: string | null;
  videoUrl: string | null;
  modules: {
    title: string;
    lessons: { title: string; videoUrl: string | null }[];
  }[];
};

export type OrderPaidEmailInput = {
  to: string;
  storeName: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  reference: string;
  items: OrderEmailLine[];
  total: number;
  amountPaid: number;
  /** Empty unless the order held digital offers. */
  access: OrderEmailAccess[];
  /** Seller-side only — deep link to the order in the dashboard. */
  orderUrl?: string;
};

function naira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

const SHELL_OPEN = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f8f7ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#081a51;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6d3df5;">Zellga</p>`;

const SHELL_CLOSE = `    </div>
  </body>
</html>`;

function itemRowsHtml(items: OrderEmailLine[]): string {
  return items
    .map(
      (line) => `
        <tr>
          <td style="padding:8px 0;font-size:15px;color:rgba(8,26,81,0.75);">
            ${escapeHtml(line.name)}${line.quantity > 1 ? ` &times; ${line.quantity}` : ""}
          </td>
          <td style="padding:8px 0;font-size:15px;text-align:right;white-space:nowrap;">
            ${naira(line.price * line.quantity)}
          </td>
        </tr>`
    )
    .join("");
}

function itemLinesText(items: OrderEmailLine[]): string[] {
  return items.map(
    (line) =>
      `  ${line.name}${line.quantity > 1 ? ` x${line.quantity}` : ""} — ${naira(
        line.price * line.quantity
      )}`
  );
}

/**
 * The buyer's copy of a paid order — a receipt, and for a digital offer the
 * delivery itself. The links are in the email on purpose: the confirmation
 * page is the fastest way to get them, but it is one closed tab away from
 * being lost, and a buyer who cannot find what they paid for messages the
 * seller.
 */
export function orderReceiptEmail(input: OrderPaidEmailInput): MailMessage {
  const store = escapeHtml(input.storeName);
  const hasAccess = input.access.length > 0;

  const accessHtml = input.access
    .map((item) => {
      const links: string[] = [];
      if (item.fileUrl) {
        links.push(
          `<a href="${escapeHtml(item.fileUrl)}" style="display:inline-block;margin:6px 8px 0 0;background:#6d3df5;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:10px 18px;border-radius:12px;">Download ${escapeHtml(item.fileName ?? "your file")}</a>`
        );
      }
      if (item.videoUrl) {
        links.push(
          `<a href="${escapeHtml(item.videoUrl)}" style="display:inline-block;margin:6px 8px 0 0;background:rgba(109,61,245,0.1);color:#6d3df5;text-decoration:none;font-weight:700;font-size:14px;padding:10px 18px;border-radius:12px;">Watch</a>`
        );
      }
      const lessons = item.modules
        .map(
          (module) => `
            <p style="margin:12px 0 4px;font-size:14px;font-weight:700;">${escapeHtml(module.title)}</p>
            <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:rgba(8,26,81,0.75);">
              ${module.lessons
                .map(
                  (lesson) =>
                    `<li>${escapeHtml(lesson.title)}${
                      lesson.videoUrl
                        ? ` — <a href="${escapeHtml(lesson.videoUrl)}" style="color:#6d3df5;">watch</a>`
                        : ""
                    }</li>`
                )
                .join("")}
            </ul>`
        )
        .join("");

      const nothing =
        !item.fileUrl && !item.videoUrl && item.modules.length === 0
          ? `<p style="margin:6px 0 0;font-size:14px;color:rgba(8,26,81,0.6);">${store} will send this to you shortly.</p>`
          : "";

      return `
        <div style="margin:16px 0 0;padding:16px;border:1px solid rgba(109,61,245,0.15);border-radius:14px;">
          <p style="margin:0;font-size:15px;font-weight:700;">${escapeHtml(item.name)}</p>
          ${links.join("")}
          ${lessons}
          ${nothing}
        </div>`;
    })
    .join("");

  const html = `${SHELL_OPEN}
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">
        Thanks for your order from ${store}
      </h1>

      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:rgba(8,26,81,0.75);">
        Your payment is confirmed. Order reference
        <strong style="color:#081a51;">${escapeHtml(input.reference)}</strong>.
      </p>

      <table style="width:100%;border-collapse:collapse;border-top:1px solid rgba(109,61,245,0.12);">
        ${itemRowsHtml(input.items)}
        <tr>
          <td style="padding:12px 0 0;border-top:1px solid rgba(109,61,245,0.12);font-size:15px;font-weight:700;">Paid</td>
          <td style="padding:12px 0 0;border-top:1px solid rgba(109,61,245,0.12);font-size:15px;font-weight:700;text-align:right;color:#6d3df5;">
            ${naira(input.amountPaid)}
          </td>
        </tr>
      </table>

      ${
        hasAccess
          ? `<p style="margin:28px 0 0;font-size:15px;font-weight:700;">Your access</p>${accessHtml}`
          : `<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:rgba(8,26,81,0.75);">
               ${store} has been notified and will be in touch about delivery.
             </p>`
      }

      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:rgba(8,26,81,0.5);">
        Keep this email — it is your receipt${hasAccess ? " and your access link" : ""}.
      </p>
${SHELL_CLOSE}`;

  const text = [
    `Thanks for your order from ${input.storeName}.`,
    "",
    `Your payment is confirmed. Order reference ${input.reference}.`,
    "",
    "What you bought:",
    ...itemLinesText(input.items),
    "",
    `Paid: ${naira(input.amountPaid)}`,
    "",
    ...(hasAccess
      ? [
          "Your access:",
          ...input.access.flatMap((item) => {
            const lines = [`  ${item.name}`];
            if (item.fileUrl)
              lines.push(`    Download${item.fileName ? ` (${item.fileName})` : ""}: ${item.fileUrl}`);
            if (item.videoUrl) lines.push(`    Watch: ${item.videoUrl}`);
            for (const module of item.modules) {
              lines.push(`    ${module.title}`);
              for (const lesson of module.lessons) {
                lines.push(
                  `      ${lesson.title}${lesson.videoUrl ? `: ${lesson.videoUrl}` : ""}`
                );
              }
            }
            if (!item.fileUrl && !item.videoUrl && !item.modules.length) {
              lines.push(`    ${input.storeName} will send this to you shortly.`);
            }
            return lines;
          }),
          "",
        ]
      : [`${input.storeName} has been notified and will be in touch about delivery.`, ""]),
    `Keep this email — it is your receipt${hasAccess ? " and your access link" : ""}.`,
  ].join("\n");

  return {
    to: input.to,
    subject: `Your order from ${input.storeName} — ${input.reference}`,
    html,
    text,
  };
}

/**
 * The seller's copy. Everything needed to act on the order without opening the
 * dashboard first, because most sellers read this on a phone: who bought,
 * what, how much, and how to reach them.
 */
export function sellerOrderEmail(input: OrderPaidEmailInput): MailMessage {
  const buyer = escapeHtml(input.buyerName);

  const html = `${SHELL_OPEN}
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">
        You got paid — ${naira(input.amountPaid)}
      </h1>

      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:rgba(8,26,81,0.75);">
        Order <strong style="color:#081a51;">${escapeHtml(input.reference)}</strong>
        from ${buyer} is paid and confirmed.
      </p>

      <table style="width:100%;border-collapse:collapse;border-top:1px solid rgba(109,61,245,0.12);">
        ${itemRowsHtml(input.items)}
        <tr>
          <td style="padding:12px 0 0;border-top:1px solid rgba(109,61,245,0.12);font-size:15px;font-weight:700;">Total</td>
          <td style="padding:12px 0 0;border-top:1px solid rgba(109,61,245,0.12);font-size:15px;font-weight:700;text-align:right;color:#6d3df5;">
            ${naira(input.amountPaid)}
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 4px;font-size:15px;font-weight:700;">Buyer</p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(8,26,81,0.75);">
        ${buyer}<br />
        ${escapeHtml(input.buyerPhone)}${
          input.buyerEmail ? `<br />${escapeHtml(input.buyerEmail)}` : ""
        }
      </p>

      ${
        input.access.length
          ? `<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:rgba(8,26,81,0.6);">
               The digital items in this order were handed over automatically —
               nothing to send.
             </p>`
          : ""
      }

      ${
        input.orderUrl
          ? `<a href="${escapeHtml(input.orderUrl)}"
                style="display:inline-block;margin-top:24px;background:#6d3df5;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:14px;">
               Open this order
             </a>`
          : ""
      }
${SHELL_CLOSE}`;

  const text = [
    `You got paid — ${naira(input.amountPaid)}`,
    "",
    `Order ${input.reference} from ${input.buyerName} is paid and confirmed.`,
    "",
    "Items:",
    ...itemLinesText(input.items),
    "",
    `Total: ${naira(input.amountPaid)}`,
    "",
    "Buyer:",
    `  ${input.buyerName}`,
    `  ${input.buyerPhone}`,
    ...(input.buyerEmail ? [`  ${input.buyerEmail}`] : []),
    ...(input.access.length
      ? ["", "The digital items in this order were handed over automatically."]
      : []),
    ...(input.orderUrl ? ["", `Open this order: ${input.orderUrl}`] : []),
  ].join("\n");

  return {
    to: input.to,
    subject: `New paid order ${input.reference} — ${naira(input.amountPaid)}`,
    html,
    text,
  };
}
