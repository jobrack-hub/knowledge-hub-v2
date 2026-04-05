import { getDoc } from "@/lib/doc-store";
import DocView from "@/components/DocView";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DocPage({
  params,
}: {
  params: Promise<{ category: string; doc: string }>;
}) {
  const { category, doc: docSlug } = await params;
  const document = await getDoc(category, docSlug);

  if (!document) {
    notFound();
  }

  const isFormatting = document.status === "formatting";
  // Use AI-formatted version if available, otherwise raw
  const displayMarkdown = document.formattedMarkdown || document.markdown;

  return (
    <DocView
      title={document.title}
      category={document.category}
      categorySlug={document.categorySlug}
      markdown={displayMarkdown}
      lastModified={document.lastModified}
      webViewLink={document.webViewLink}
      isFormatting={isFormatting}
    />
  );
}
