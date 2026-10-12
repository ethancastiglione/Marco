import "server-only";

import sanitizeHtml from "sanitize-html";

const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i];

/** Allowlist for composer output: basic formatting, lists, quotes, links, fonts and colours. */
export function sanitizeEmailHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["a", "b", "strong", "i", "em", "u", "s", "strike", "br", "p", "div", "span", "font", "ul", "ol", "li", "blockquote"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      font: ["face", "size", "color"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": {
        color: COLOR,
        "background-color": COLOR,
        "text-align": [/^(left|center|right|justify)$/],
        "font-family": [/^[\w\s,"'-]+$/],
        "font-size": [/^[\d.]+(px|em|rem|%)$/, /^(x-small|small|medium|large|x-large|xx-large)$/],
        "font-weight": [/^(bold|normal|\d00)$/],
        "font-style": [/^(italic|normal)$/],
        "text-decoration": [/^[\w\s-]+$/],
        "margin-left": [/^\d+px$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  });
}
