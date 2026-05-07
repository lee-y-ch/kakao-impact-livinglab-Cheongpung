import {
  buildOwnerLetterPrompt,
  normalizeDraft,
  type LetterDraftInput,
} from "./prompt";

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

const DEFAULT_MODEL = "gemini-2.5-flash-lite";

export async function draftOwnerLetterIntroWithGemini(input: LetterDraftInput) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const prompt = buildOwnerLetterPrompt(input);
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  );
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 180,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini request failed: ${response.status} ${detail}`);
  }

  const data = (await response.json()) as GeminiGenerateContentResponse;
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  return normalizeDraft(text);
}
