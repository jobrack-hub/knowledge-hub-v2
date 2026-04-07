"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  Bot,
  RefreshCw,
  Search,
  Flag,
} from "lucide-react";

interface Category {
  name: string;
  slug: string;
  docCount: number;
}

interface Doc {
  title: string;
  slug: string;
  categorySlug: string;
}

interface SidebarProps {
  onToggleChat: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  dwy: "🎯",
  ea: "📋",
  sales: "💰",
  "sales-admin": "💰",
};

const CATEGORY_COLORS: Record<string, string> = {
  dwy: "#3ECFB2",
  ea: "#5B6ADD",
  sales: "#F07840",
  "sales-admin": "#F07840",
};

export default function Sidebar({ onToggleChat }: SidebarProps) {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 1) {
      setExpanded({ [parts[0]]: true });
    }
  }, [pathname]);

  async function fetchData() {
    try {
      const res = await fetch("/api/docs");
      const data = await res.json();
      setCategories(data.categories || []);
      setDocs(
        (data.allDocs || data.recentDocs || []).map(
          (d: { title: string; slug: string; categorySlug: string }) => ({
            title: d.title,
            slug: d.slug,
            categorySlug: d.categorySlug,
          })
        )
      );
    } catch {
      // Silently fail
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/sync");
      await fetchData();
    } finally {
      setSyncing(false);
    }
  }

  function toggleCategory(slug: string) {
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }

  const filteredDocs = searchQuery
    ? docs.filter((d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#E8EAF0]">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#E8EAF0]">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
            style={{ background: "#1A2340", fontWeight: 800 }}
          >
            JR
          </div>
          <div>
            <p className="text-sm text-[#1A2340] leading-tight" style={{ fontWeight: 800 }}>
              JobRack
            </p>
            <p className="text-[10px] text-[#6B7299] leading-tight">Knowledge Hub</p>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2.5 text-[#6B7299]" />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-[#F5F6FA] border border-[#E8EAF0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ECFB2]/30 focus:border-[#3ECFB2] text-[#2D3550] placeholder-[#6B7299]"
          />
        </div>
      </div>

      {/* Search results */}
      {searchQuery && (
        <div className="px-3 py-2 border-b border-[#E8EAF0]">
          <p className="px-2 text-[10px] text-[#6B7299] uppercase tracking-widest mb-1 font-700">
            Results
          </p>
          {filteredDocs.length === 0 && (
            <p className="px-2 text-xs text-[#6B7299] italic">No results</p>
          )}
          {filteredDocs.map((doc) => (
            <Link
              key={`${doc.categorySlug}-${doc.slug}`}
              href={`/${doc.categorySlug}/${doc.slug}`}
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg hover:bg-[#F5F6FA] text-[#2D3550] transition-all"
              onClick={() => setSearchQuery("")}
            >
              <FileText size={13} className="text-[#6B7299] shrink-0" />
              <span className="truncate">{doc.title}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] text-[#6B7299] uppercase tracking-widest" style={{ fontWeight: 700 }}>
          Categories
        </p>

        {categories.length === 0 && (
          <p className="px-3 py-2 text-xs text-[#6B7299] italic">
            No docs synced yet.
          </p>
        )}

        {categories.map((cat) => {
          const isActive = pathname.startsWith(`/${cat.slug}`);
          const color = CATEGORY_COLORS[cat.slug] || "#6B7299";

          return (
            <div key={cat.slug}>
              <button
                onClick={() => toggleCategory(cat.slug)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? "bg-[#1A2340] text-white"
                    : "text-[#2D3550] hover:bg-[#F0F1F5]"
                }`}
              >
                <span className="text-base leading-none">
                  {CATEGORY_ICONS[cat.slug] || "📁"}
                </span>
                <span className="flex-1 text-sm leading-snug" style={{ fontWeight: 600 }}>
                  {cat.name}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    fontWeight: 700,
                    background: isActive ? "rgba(255,255,255,0.15)" : `${color}15`,
                    color: isActive ? "rgba(255,255,255,0.7)" : color,
                  }}
                >
                  {cat.docCount}
                </span>
                {expanded[cat.slug] ? (
                  <ChevronDown
                    size={13}
                    className={isActive ? "text-white/60" : "text-[#6B7299]"}
                  />
                ) : (
                  <ChevronRight
                    size={13}
                    className={isActive ? "text-white/60" : "text-[#6B7299]"}
                  />
                )}
              </button>

              {expanded[cat.slug] && (
                <div className="ml-4 mt-1 mb-1 space-y-0.5">
                  {docs
                    .filter((d) => d.categorySlug === cat.slug)
                    .map((doc) => {
                      const isDocActive =
                        pathname === `/${cat.slug}/${doc.slug}`;
                      return (
                        <Link
                          key={doc.slug}
                          href={`/${cat.slug}/${doc.slug}`}
                          className={`w-full block text-left px-3 py-2 rounded-lg text-sm transition-all ${
                            isDocActive
                              ? "bg-[#E8EAF0] text-[#1A2340]"
                              : "text-[#6B7299] hover:text-[#2D3550] hover:bg-[#F5F6FA]"
                          }`}
                          style={{ fontWeight: isDocActive ? 700 : 400 }}
                        >
                          <span className="truncate block">{doc.title}</span>
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}

        {/* Tools section */}
        <div className="pt-4">
          <p className="px-3 mb-2 text-[10px] text-[#6B7299] uppercase tracking-widest" style={{ fontWeight: 700 }}>
            Tools
          </p>

          <button
            onClick={onToggleChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all text-[#2D3550] hover:bg-[#EBF9F6]"
          >
            <Bot size={15} style={{ color: "#3ECFB2" }} />
            <span className="flex-1 text-sm" style={{ fontWeight: 600 }}>
              Ask AI
            </span>
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all text-[#2D3550] hover:bg-[#F0F1F5] disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={`text-[#6B7299] ${syncing ? "animate-spin" : ""}`}
            />
            <span className="flex-1 text-sm" style={{ fontWeight: 600 }}>
              {syncing ? "Syncing..." : "Sync from Drive"}
            </span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#E8EAF0]">
        <p className="text-[10px] text-[#6B7299]">Synced from Google Drive</p>
      </div>
    </div>
  );
}
