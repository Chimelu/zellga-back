import sanitizeHtml from "sanitize-html";

/**
 * Descriptions are written in a rich-text editor, so they arrive as HTML and
 * are rendered as HTML on the storefront. That makes them the one piece of
 * seller-authored markup a buyer's browser executes, and the only thing
 * standing between a seller and script running on their own store page is this
 * file.
 *
 * The allowlist is everything the editor's toolbar can produce and nothing
 * else. It is deliberately not "block the dangerous tags" — an allowlist fails
 * closed when the editor gains a button, a denylist fails open.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "ol",
    "ul",
    "li",
    "h2",
    "h3",
    "blockquote",
    "a",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  // Anything else — `javascript:`, `data:`, a bare `vbscript:` — takes the
  // link's href with it.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  /**
   * A description is untrusted text, so every link in one opens detached:
   * `target="_blank"` without `rel="noopener"` hands `window.opener` to
   * whatever the seller linked to.
   */
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer nofollow",
    }),
  },
  // Discard the contents too — a stripped `<script>` should not leave its body
  // behind as visible text.
  nonTextTags: ["style", "script", "textarea", "option", "noscript"],
};

/**
 * Cleans a description for storage and for display.
 *
 * Applied on the way in so what is stored is already safe, and again on the
 * way out so rows written before the editor existed — plain text that may hold
 * anything a seller once typed into a textarea — are safe the first time they
 * are rendered as HTML rather than escaped as text.
 *
 * Returns null for anything that is empty once cleaned, so `<p><br></p>` from
 * an editor the seller opened and left alone does not count as a description.
 */
export function sanitizeRichText(value: string | null | undefined): string | null {
  if (!value) return null;
  const clean = sanitizeHtml(value, OPTIONS).trim();
  return isBlank(clean) ? null : clean;
}

/** Markup with no words in it — an empty paragraph, a stray `<br>`. */
function isBlank(html: string): boolean {
  return richTextToPlain(html).length === 0;
}

/**
 * The description as words, for anything that cannot show markup: a WhatsApp
 * order message, a meta description, a search index.
 */
export function richTextToPlain(value: string | null | undefined): string {
  if (!value) return "";
  // Stripping tags butts the blocks together — "<h2>Hi</h2><p>There</p>" would
  // read "HiThere" — so a block boundary becomes a space before they go.
  const spaced = value.replace(
    /<(?:br|\/p|\/li|\/h[1-6]|\/blockquote|\/ol|\/ul)\s*\/?>/gi,
    " "
  );
  return (
    sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
      // Entities survive tag-stripping, and `&amp;` in a plain-text message is
      // just wrong.
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim()
  );
}
