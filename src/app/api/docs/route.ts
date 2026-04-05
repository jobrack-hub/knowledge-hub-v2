import { NextResponse } from "next/server";
import { getAllDocs, getCategories } from "@/lib/doc-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [categories, docs] = await Promise.all([getCategories(), getAllDocs()]);

  // All docs (light — just metadata, no markdown) sorted by recent
  const allDocs = [...docs]
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .map(({ id, title, slug, category, categorySlug, lastModified }) => ({
      id, title, slug, category, categorySlug, lastModified,
    }));

  const recentDocs = allDocs.slice(0, 10);

  return NextResponse.json({ categories, recentDocs, allDocs });
}
