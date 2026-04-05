import { getAllDocs } from "./doc-store";

export async function buildAIContext(): Promise<string> {
  const docs = await getAllDocs();

  if (docs.length === 0) {
    return "No SOPs have been synced yet. Please run a sync first.";
  }

  const sections = docs.map(
    (doc) =>
      `--- DOCUMENT: ${doc.title} (Category: ${doc.category}) ---\n${doc.formattedMarkdown || doc.markdown}\n--- END ---`
  );

  return sections.join("\n\n");
}

export function buildSystemPrompt(context: string): string {
  return `You are a JobRack SOP assistant. You help team members find and understand information from the company's Standard Operating Procedures.

RULES:
- Answer ONLY based on the documentation provided below
- If the answer is not in the documentation, say "I couldn't find that in the SOPs"
- When referencing information, mention which document and category it comes from
- Be concise and practical
- Use bullet points for lists
- If asked about a process, walk through the steps clearly

DOCUMENTATION:
${context}`;
}
