import { getDocsByCategory, getCategories } from "@/lib/doc-store";
import Link from "next/link";
import { FileText, ChevronLeft, Clock } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const CATEGORY_COLORS: Record<string, string> = {
  dwy: "#3ECFB2",
  ea: "#5B6ADD",
  sales: "#F07840",
  "sales-admin": "#F07840",
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const [docs, categories] = await Promise.all([
    getDocsByCategory(category),
    getCategories(),
  ]);

  const currentCategory = categories.find((c) => c.slug === category);
  if (!currentCategory && docs.length === 0) {
    notFound();
  }

  const categoryName = currentCategory?.name || category;
  const color = CATEGORY_COLORS[category] || "#6B7299";

  return (
    <div className="max-w-4xl mx-auto fade-in">
      {/* Back */}
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm text-[#6B7299] hover:text-[#1A2340] transition-colors mb-4"
      >
        <ChevronLeft size={15} />
        Back to Home
      </Link>

      {/* Header */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: `linear-gradient(135deg, ${color}15, ${color}08)`,
          borderLeft: `4px solid ${color}`,
        }}
      >
        <p
          className="text-xs text-[#6B7299] uppercase tracking-widest mb-1"
          style={{ fontWeight: 700 }}
        >
          Category
        </p>
        <h1 className="text-2xl text-[#1A2340] mb-2" style={{ fontWeight: 800 }}>
          {categoryName}
        </h1>
        <p className="text-sm text-[#6B7299]">
          {docs.length} {docs.length === 1 ? "document" : "documents"}
        </p>
      </div>

      {/* Empty state */}
      {docs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#D0D4E8]">
          <div className="text-3xl mb-3">📄</div>
          <p className="text-sm text-[#6B7299]">No documents in this category yet.</p>
        </div>
      )}

      {/* Doc list */}
      <div className="space-y-2">
        {docs.map((doc) => (
          <Link
            key={doc.id}
            href={`/${category}/${doc.slug}`}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white border border-[#E8EAF0] hover:shadow-md hover:border-transparent transition-all duration-200 group hover:-translate-y-0.5"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}15` }}
            >
              <FileText size={20} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[#1A2340] group-hover:text-[#3ECFB2] transition-colors"
                style={{ fontWeight: 600 }}
              >
                {doc.title}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock size={11} className="text-[#6B7299]" />
                <span className="text-xs text-[#6B7299]">
                  Updated{" "}
                  {new Date(doc.lastModified).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {doc.status === "formatting" && (
                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-[#FEF8E7] text-[#C9960A]" style={{ fontWeight: 700 }}>
                    Formatting...
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
