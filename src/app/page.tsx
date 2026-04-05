import { getCategories, getAllDocs } from "@/lib/doc-store";
import Link from "next/link";
import { FileText, Users, Clock, ArrowRight, Bot, Flag } from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORY_COLORS: Record<string, string> = {
  dwy: "#3ECFB2",
  ea: "#5B6ADD",
  sales: "#F07840",
  "sales-admin": "#F07840",
};

const CATEGORY_ICONS: Record<string, string> = {
  dwy: "🎯",
  ea: "📋",
  sales: "💰",
  "sales-admin": "💰",
};

export default async function HomePage() {
  const [categories, allDocs] = await Promise.all([
    getCategories(),
    getAllDocs(),
  ]);

  const recentDocs = [...allDocs]
    .sort(
      (a, b) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    )
    .slice(0, 6);

  const totalDocs = allDocs.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 fade-in">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl text-[#1A2340] mb-2" style={{ fontWeight: 800 }}>
          Knowledge Hub
        </h1>
        <p className="text-[#6B7299]">SOPs and process guides for the JobRack team.</p>
      </div>

      {/* Quick stats */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="bg-white rounded-xl border border-[#E8EAF0] px-5 py-4 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "#EBF9F6" }}
          >
            <Users size={16} style={{ color: "#2BB89C" }} />
          </div>
          <div>
            <p className="text-xl text-[#1A2340]" style={{ fontWeight: 800 }}>
              {totalDocs}
            </p>
            <p className="text-xs text-[#6B7299]" style={{ fontWeight: 600 }}>
              Documents
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8EAF0] px-5 py-4 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "#EBF9F6" }}
          >
            <Bot size={16} style={{ color: "#3ECFB2" }} />
          </div>
          <div>
            <p className="text-sm text-[#1A2340]" style={{ fontWeight: 700 }}>
              Ask AI
            </p>
            <p className="text-xs text-[#6B7299]">SOP-grounded answers</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E8EAF0] px-5 py-4 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "#F5F6FA" }}
          >
            <Flag size={16} style={{ color: "#6B7299" }} />
          </div>
          <div>
            <p className="text-xl text-[#1A2340]" style={{ fontWeight: 800 }}>
              {categories.length}
            </p>
            <p className="text-xs text-[#6B7299]" style={{ fontWeight: 600 }}>
              Categories
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {categories.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#D0D4E8]">
          <div className="text-4xl mb-4">📁</div>
          <h2 className="text-lg text-[#1A2340] mb-2" style={{ fontWeight: 700 }}>
            No docs synced yet
          </h2>
          <p className="text-sm text-[#6B7299]">
            Click &ldquo;Sync from Drive&rdquo; in the sidebar to pull in your SOPs.
          </p>
        </div>
      )}

      {/* Category cards */}
      {categories.length > 0 && (
        <div className="mb-10">
          <p
            className="text-[10px] text-[#6B7299] uppercase tracking-widest mb-4"
            style={{ fontWeight: 700 }}
          >
            All Categories
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const color = CATEGORY_COLORS[cat.slug] || "#6B7299";
              return (
                <Link
                  key={cat.slug}
                  href={`/${cat.slug}`}
                  className="group bg-white rounded-2xl border border-[#E8EAF0] p-5 text-left hover:shadow-md hover:border-transparent transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: `${color}15` }}
                    >
                      {CATEGORY_ICONS[cat.slug] || "📁"}
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-[#D0D4E8] group-hover:text-[#3ECFB2] transition-colors mt-1"
                    />
                  </div>

                  <h3
                    className="text-[#1A2340] text-base mb-3 leading-snug"
                    style={{ fontWeight: 800 }}
                  >
                    {cat.name}
                  </h3>

                  <div className="flex items-center gap-1">
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="text-xs text-[#6B7299]">
                      {cat.docCount} {cat.docCount === 1 ? "document" : "documents"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recently updated */}
      {recentDocs.length > 0 && (
        <div>
          <p
            className="text-[10px] text-[#6B7299] uppercase tracking-widest mb-4"
            style={{ fontWeight: 700 }}
          >
            Recently Updated
          </p>
          <div className="space-y-2">
            {recentDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/${doc.categorySlug}/${doc.slug}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#E8EAF0] hover:shadow-sm hover:border-[#D0D4E8] transition-all group"
              >
                <FileText
                  size={18}
                  className="text-[#6B7299] group-hover:text-[#3ECFB2] shrink-0 transition-colors"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm text-[#1A2340] truncate group-hover:text-[#3ECFB2] transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    {doc.title}
                  </p>
                  <p className="text-xs text-[#6B7299]">{doc.category}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#6B7299] shrink-0">
                  <Clock size={11} />
                  <span>
                    {new Date(doc.lastModified).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
