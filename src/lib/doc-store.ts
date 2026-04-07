import { put, head, getDownloadUrl } from "@vercel/blob";

const BLOB_KEY = "docs.json";

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

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getAllDocs(): Promise<StoredDoc[]> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.warn("BLOB_READ_WRITE_TOKEN is not set — documents will not load");
      return [];
    }

    // Find the blob by prefix
    const { blobs } = await (await import("@vercel/blob")).list({ prefix: BLOB_KEY, token });
    if (!blobs.length) return [];

    // Use a signed download URL since the store is private
    const downloadUrl = await getDownloadUrl(blobs[0].url, { token });
    const res = await fetch(downloadUrl, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveDocs(docs: StoredDoc[]): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN not set");

  await put(BLOB_KEY, JSON.stringify(docs, null, 2), {
    access: "private",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
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
