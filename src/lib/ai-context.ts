import { getAllDocs, type StoredDoc } from "./doc-store";

export async function buildAIContext(userQuery?: string): Promise<string> {
  const docs = await getAllDocs();

  if (docs.length === 0) {
    return "No SOPs have been synced yet. Please run a sync first.";
  }

  let selectedDocs: StoredDoc[];

  if (userQuery) {
    // Score each doc by how many query terms it contains
    const queryTerms = userQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const scored = docs.map((doc) => {
      const content = doc.markdown.toLowerCase();
      const score = queryTerms.reduce((sum, term) => {
        const count = content.split(term).length - 1;
        return sum + count;
      }, 0);
      return { doc, score };
    });

    // Sort by relevance
    scored.sort((a, b) => b.score - a.score);

    // Take the most relevant docs, up to ~40k chars
    selectedDocs = [];
    let totalChars = 0;
    for (const { doc, score } of scored) {
      if (totalChars + doc.markdown.length > 50000 && selectedDocs.length > 0) break;
      selectedDocs.push(doc);
      totalChars += doc.markdown.length;
    }
  } else {
    selectedDocs = docs;
  }

  const sections = selectedDocs.map(
    (doc) =>
      `--- DOCUMENT: ${doc.title} (Category: ${doc.category}) ---\n${doc.markdown}\n--- END ---`
  );

  return sections.join("\n\n");
}
