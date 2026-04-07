"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, Clock, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface DocViewProps {
  title: string;
  category: string;
  categorySlug: string;
  markdown: string;
  lastModified: string;
  webViewLink: string;
  isFormatting?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  dwy: "#3ECFB2",
  ea: "#5B6ADD",
  sales: "#F07840",
  "sales-admin": "#F07840",
};

export default function DocView({
  title,
  category,
  categorySlug,
  markdown,
  lastModified,
  webViewLink,
  isFormatting,
}: DocViewProps) {
  const formattedDate = new Date(lastModified).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const color = CATEGORY_COLORS[categorySlug] || "#6B7299";

  // Extract headings for TOC
  const headings = markdown.match(/^#{1,3}\s+.+$/gm) || [];
  const toc = headings.map((h) => {
    const level = h.match(/^#+/)?.[0].length || 1;
    const text = h.replace(/^#+\s+/, "");
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return { level, text, id };
  });

  return (
    <div className="fade-in">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href={`/${categorySlug}`}
          className="flex items-center gap-1.5 text-sm text-[#6B7299] hover:text-[#1A2340] transition-colors"
        >
          <ChevronLeft size={15} />
          Back to {category}
        </Link>
      </div>

      {/* SOP Header */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: `linear-gradient(135deg, ${color}15, ${color}08)`,
          borderLeft: `4px solid ${color}`,
        }}
      >
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p
              className="text-xs text-[#6B7299] uppercase tracking-widest mb-1"
              style={{ fontWeight: 700 }}
            >
              {category}
            </p>
            <h1 className="text-xl text-[#1A2340] mb-3" style={{ fontWeight: 800 }}>
              {title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 text-[#6B7299] text-xs">
                <Clock size={11} />
                <span>Updated {formattedDate}</span>
              </div>
              {webViewLink && (
                <a
                  href={webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs hover:underline"
                  style={{ color }}
                >
                  <ExternalLink size={11} />
                  Open in Google Docs
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formatting state */}
      {isFormatting && (
        <div className="bg-white rounded-2xl border border-[#E8EAF0] p-8 text-center">
          <div className="flex justify-center gap-1 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#3ECFB2] pulse-dot" style={{ animationDelay: "0s" }} />
            <div className="w-2 h-2 rounded-full bg-[#3ECFB2] pulse-dot" style={{ animationDelay: "0.2s" }} />
            <div className="w-2 h-2 rounded-full bg-[#3ECFB2] pulse-dot" style={{ animationDelay: "0.4s" }} />
          </div>
          <h3 className="text-lg text-[#1A2340] mb-2" style={{ fontWeight: 700 }}>
            Formatting document...
          </h3>
          <p className="text-sm text-[#6B7299]">
            AI is structuring this document for easy reading. This may take a moment.
          </p>
        </div>
      )}

      {/* Content + TOC layout */}
      {!isFormatting && (
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-[#E8EAF0] p-6 shadow-sm">
              <div className="sop-content select-text">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children, ...props }) => {
                      const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                      return <h1 id={id} {...props}>{children}</h1>;
                    },
                    h2: ({ children, ...props }) => {
                      const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                      return <h2 id={id} {...props}>{children}</h2>;
                    },
                    h3: ({ children, ...props }) => {
                      const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                      return <h3 id={id} {...props}>{children}</h3>;
                    },
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="w-full border-collapse text-sm">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-2 text-left text-xs font-bold text-[#1A2340] bg-[#F5F6FA] border border-[#E8EAF0] uppercase tracking-wide">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-2 text-sm text-[#2D3550] border border-[#E8EAF0] align-top">
                        {children}
                      </td>
                    ),
                    img: ({ src, alt }) => {
                      // Only allow http/https to prevent javascript: or data: XSS
                      let safeSrc = "";
                      try {
                        const url = new URL(typeof src === "string" ? src : "");
                        if (url.protocol === "http:" || url.protocol === "https:") {
                          safeSrc = url.href;
                        }
                      } catch {
                        // invalid URL — render as broken image
                      }
                      return (
                      <span className="block my-4">
                        <img
                          src={safeSrc}
                          alt={alt || ""}
                          className="rounded-xl border border-[#E8EAF0] max-w-full shadow-sm"
                          style={{ maxHeight: "520px", objectFit: "contain" }}
                        />
                        {alt && (
                          <span className="block text-xs text-[#6B7299] mt-1.5 italic">
                            {alt}
                          </span>
                        )}
                      </span>
                      );
                    },
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Table of Contents — right side */}
          {toc.length > 2 && (
            <div className="w-48 shrink-0 hidden lg:block">
              <div className="sticky top-6 bg-white rounded-2xl border border-[#E8EAF0] p-3">
                <p
                  className="text-[10px] text-[#6B7299] uppercase tracking-widest mb-2 px-2"
                  style={{ fontWeight: 700 }}
                >
                  On this page
                </p>
                <nav className="space-y-0.5">
                  {toc.map((item, i) => (
                    <a
                      key={i}
                      href={`#${item.id}`}
                      className={`block px-2 py-1.5 rounded-lg text-sm text-[#6B7299] hover:text-[#1A2340] hover:bg-[#F5F6FA] transition-all truncate ${
                        item.level === 1
                          ? "font-bold"
                          : item.level === 2
                          ? "pl-4"
                          : "pl-6 text-xs"
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
