import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const FORMAT_PROMPT = `You are a document formatter for JobRack, a recruitment company.
Take the raw document content below and reformat it into clean, beautifully structured markdown.

FORMATTING RULES:
- Use clear hierarchy: # for main title, ## for major sections, ### for subsections
- Use numbered lists for step-by-step processes
- Use bullet points for non-sequential lists
- Use **bold** for key terms, names, and important words
- Use > blockquotes for important tips, warnings, or notes (prefix with "💡 Tip:", "⚠️ Important:", or "📌 Note:")
- Use --- horizontal rules to separate major sections
- Keep the tone professional but easy to scan
- Add emoji sparingly to section headers for visual clarity (e.g., 📋, 🎯, ✅, 📞, 📧)
- Break long paragraphs into shorter ones (max 3-4 sentences each)
- If there are process steps, make them very clear with numbered lists
- Preserve ALL original information — do not remove or change any facts
- If there are links, preserve them
- If content references tools (Monday.com, Slack, Google Drive, etc.), keep those references

EMAIL TEMPLATES (very important):
- Google Docs often stores email templates inside tables — these will appear as markdown tables in the input
- NEVER render email templates as tables
- Instead, render each email template as a clean block using this exact format:

> **Subject:** [subject line if present]
>
> Hey [NAME],
>
> [body paragraph]
>
> [body paragraph]
>
> [sign-off]
> [name]

- Each distinct email template (e.g. PH1, PH2, follow-up sequences) should be its own labelled section with a ## heading
- Placeholders like NAME, CANDIDATE NAME should be shown as **[NAME]**, **[CANDIDATE NAME]**
- Only use actual markdown tables for genuinely tabular data (e.g. comparison grids, data with clear column headers)

OUTPUT: Return ONLY the formatted markdown. No explanations or meta-commentary.`;

export async function formatDocWithAI(rawMarkdown: string, docTitle: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return rawMarkdown; // Return unformatted if no API key
  }

  try {
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_FORMAT_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: FORMAT_PROMPT },
        {
          role: "user",
          content: `Document title: "${docTitle}"\n\nRaw content:\n\n${rawMarkdown}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const formatted = completion.choices[0]?.message?.content;
    return formatted || rawMarkdown;
  } catch (err) {
    console.error(`AI formatting failed for "${docTitle}":`, err);
    return rawMarkdown; // Fallback to raw
  }
}
