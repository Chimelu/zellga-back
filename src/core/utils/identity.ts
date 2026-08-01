export function slugifyStoreName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "my-store"
  );
}

/** Normalize Nigerian-style numbers to digits-only (234…). */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("234") && digits.length >= 13) {
    return digits.slice(0, 13);
  }
  if (digits.startsWith("0") && digits.length >= 11) {
    return `234${digits.slice(1, 11)}`;
  }
  if (digits.length === 10) {
    return `234${digits}`;
  }
  return digits;
}
