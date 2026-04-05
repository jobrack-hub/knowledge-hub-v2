import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Preserve tables
turndown.addRule("tableCell", {
  filter: ["th", "td"],
  replacement(content, node) {
    return ` ${content.trim()} |`;
  },
});

turndown.addRule("tableRow", {
  filter: "tr",
  replacement(content) {
    return `|${content}\n`;
  },
});

turndown.addRule("table", {
  filter: "table",
  replacement(content) {
    const rows = content.trim().split("\n").filter(Boolean);
    if (rows.length === 0) return content;
    // Add separator after header row
    const headerCells = rows[0].split("|").filter(Boolean);
    const separator = "|" + headerCells.map(() => " --- ").join("|") + "|\n";
    return "\n\n" + rows[0] + "\n" + separator + rows.slice(1).join("\n") + "\n\n";
  },
});

// Remove Google Docs style tags and spans with inline styles
turndown.addRule("removeStyles", {
  filter: (node) => {
    return node.nodeName === "STYLE" || node.nodeName === "SCRIPT";
  },
  replacement: () => "",
});

// Handle Google Docs images
turndown.addRule("googleImages", {
  filter: "img",
  replacement(_content, node) {
    const src = (node as HTMLImageElement).getAttribute("src") || "";
    const alt = (node as HTMLImageElement).getAttribute("alt") || "image";
    if (src.startsWith("data:")) return ""; // Skip inline base64 images
    return `![${alt}](${src})`;
  },
});

export function htmlToMarkdown(html: string): string {
  // Clean up Google Docs-specific markup
  let cleaned = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/class="[^"]*"/gi, "")
    .replace(/style="[^"]*"/gi, "")
    .replace(/id="[^"]*"/gi, "")
    .replace(/<span>\s*<\/span>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/&nbsp;/gi, " ");

  const md = turndown.turndown(cleaned);

  // Clean up excessive whitespace
  return md
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+$/gm, "")
    .trim();
}
