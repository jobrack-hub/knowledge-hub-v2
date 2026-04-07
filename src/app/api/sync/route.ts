import { NextResponse } from "next/server";
import { listSubfolders, listDocsInFolder, exportDocAsHtml } from "@/lib/google-drive";
import { htmlToMarkdown } from "@/lib/markdown";
import { saveDocs, getAllDocs, slugify, type StoredDoc } from "@/lib/doc-store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const hubPassword = process.env.HUB_PASSWORD;

  // Accept either: Vercel cron Bearer token, or a logged-in user's cookie
  const hasCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieToken = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("hub-auth="))
    ?.split("=")[1];
  const expectedCookie = hubPassword ? await hashPassword(hubPassword) : null;
  const hasCookieAuth = expectedCookie && cookieToken === expectedCookie;

  if (!hasCronAuth && !hasCookieAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    return NextResponse.json({ error: "Missing GOOGLE_DRIVE_FOLDER_ID" }, { status: 500 });
  }

  try {
    const folders = await listSubfolders(folderId);
    const existingDocs = await getAllDocs();
    const existingMap = new Map(existingDocs.map((d) => [d.id, d]));
    const allDocs: StoredDoc[] = [];
    const now = new Date().toISOString();
    let newOrUpdated = 0;

    for (const folder of folders) {
      const docs = await listDocsInFolder(folder.id);

      for (const doc of docs) {
        try {
          const existing = existingMap.get(doc.id);

          // Skip if doc hasn't changed since last sync
          if (existing && existing.lastModified === doc.modifiedTime && existing.status !== "formatting") {
            allDocs.push(existing);
            continue;
          }

          let rawMarkdown = "";

          if (doc.mimeType === "application/vnd.google-apps.document") {
            const html = await exportDocAsHtml(doc.id);
            rawMarkdown = htmlToMarkdown(html);
          } else {
            rawMarkdown = `*This document is a ${doc.mimeType.split("/").pop()} file. [Open in Google Drive](${doc.webViewLink})*`;
          }

          // Save immediately with "formatting" status so UI can show placeholder
          const docEntry: StoredDoc = {
            id: doc.id,
            title: doc.name,
            category: folder.name,
            categorySlug: slugify(folder.name),
            slug: slugify(doc.name),
            markdown: rawMarkdown,
            formattedMarkdown: "",
            lastModified: doc.modifiedTime,
            lastSynced: now,
            webViewLink: doc.webViewLink,
            status: "formatting",
          };

          allDocs.push(docEntry);
          newOrUpdated++;
        } catch (docErr) {
          console.error(`Failed to process doc ${doc.name}:`, docErr);
        }
      }
    }

    // Save with formatting status first so UI updates quickly
    await saveDocs(allDocs);

    // Skip AI formatting during sync — use raw markdown immediately
    // (AI formatting takes too long and causes timeout on Vercel)
    for (const doc of allDocs) {
      if (doc.status === "formatting") {
        doc.formattedMarkdown = doc.markdown;
        doc.status = "ready";
      }
    }

    // Save with ready status
    await saveDocs(allDocs);

    return NextResponse.json({
      success: true,
      categories: folders.map((f) => f.name),
      totalDocs: allDocs.length,
      newOrUpdated,
      syncedAt: now,
    });
  } catch (err) {
    console.error("Sync failed:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
