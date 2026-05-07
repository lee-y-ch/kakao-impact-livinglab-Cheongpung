import {
  buildOwnerLetterPrompt,
  normalizeDraft,
  type LetterDraftInput,
} from "./prompt";

type AnthropicMessageResponse = {
  content?: Array<{ type?: string; text?: string }>;
};

const DEFAULT_MODEL = "claude-3-5-haiku-latest";

export async function draftOwnerLetterIntroWithAnthropic(
  input: LetterDraftInput
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  const prompt = buildOwnerLetterPrompt(input);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: 180,
      temperature: 0.6,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Anthropic request failed: ${response.status} ${detail}`);
  }

  const data = (await response.json()) as AnthropicMessageResponse;
  const text =
    data.content
      ?.map((part) => (part.type === "text" ? part.text : ""))
      .join("")
      .trim() ?? "";

  return normalizeDraft(text);
}
