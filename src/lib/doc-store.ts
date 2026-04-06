import { promises as fs } from "fs";
import path from "path";

// Vercel's filesystem is read-only except for /tmp
const CACHE_DIR =
  process.env.NODE_ENV === "production"
    ? "/tmp/.doc-cache"
    : path.join(process.cwd(), ".doc-cache");

export interface StoredDoc {
  id: string;
  title: string;
  category: string;
  categorySlug: string;
  slug: string;
  markdown: string;
  formattedMarkdown?: string;
  lastModified: string;
  lastSynced: string;
  webViewLink: string;
  status?: "formatting" | "ready";
}

export interface CategoryInfo {
  name: string;
  slug: string;
  docCount: number;
}

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export { slugify };

async function getCachePath() {
  await ensureCacheDir();
  return path.join(CACHE_DIR, "docs.json");
}

export async function getAllDocs(): Promise<StoredDoc[]> {
  try {
    const cachePath = await getCachePath();
    const data = await fs.readFile(cachePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveDocs(docs: StoredDoc[]): Promise<void> {
  const cachePath = await getCachePath();
  await fs.writeFile(cachePath, JSON.stringify(docs, null, 2));
}

export async function getCategories(): Promise<CategoryInfo[]> {
  const docs = await getAllDocs();
  const categoryMap = new Map<string, { name: string; slug: string; count: number }>();

  for (const doc of docs) {
    const existing = categoryMap.get(doc.categorySlug);
    if (existing) {
      existing.count++;
    } else {
      categoryMap.set(doc.categorySlug, {
        name: doc.category,
        slug: doc.categorySlug,
        count: 1,
      });
    }
  }

  return Array.from(categoryMap.values()).map((c) => ({
    name: c.name,
    slug: c.slug,
    docCount: c.count,
  }));
}

export async function getDocsByCategory(categorySlug: string): Promise<StoredDoc[]> {
  const docs = await getAllDocs();
  return docs.filter((d) => d.categorySlug === categorySlug);
}

export async function getDoc(
  categorySlug: string,
  docSlug: string
): Promise<StoredDoc | null> {
  const docs = await getAllDocs();
  return (
    docs.find((d) => d.categorySlug === categorySlug && d.slug === docSlug) ||
    null
  );
}
