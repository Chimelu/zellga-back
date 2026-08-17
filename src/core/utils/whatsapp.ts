import type { Order } from "../models/order.model";
import { normalizePhone } from "./identity";

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * The message a buyer sends the vendor. Built server-side from the saved
 * order so the reference quoted in WhatsApp always matches a real row — a
 * client-composed message could drift from what was recorded.
 */
export function buildWhatsAppOrderMessage(
  order: Order,
  storeName: string
): string {
  const lines = [
    `Hello ${storeName}, I just placed an order on Zellga.`,
    "",
    `Order #${order.reference}`,
  ];

  for (const item of order.items) {
    // Quantity is only worth stating when it is more than one.
    const quantity = item.quantity > 1 ? ` x${item.quantity}` : "";
    lines.push(
      `Product: ${item.name}${quantity} — ${formatNaira(
        item.price * item.quantity
      )}`
    );
  }

  lines.push(
    `Total: ${formatNaira(order.total)}`,
    `Customer: ${order.buyerName}`,
    `WhatsApp: ${order.buyerPhone}`
  );

  if (order.note) {
    lines.push(`Note: ${order.note}`);
  }

  return lines.join("\n");
}

/**
 * `wa.me` deep link. The number must be digits-only with a country code, which
 * is what `normalizePhone` produces for Nigerian input.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const number = normalizePhone(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
