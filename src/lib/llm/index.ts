import { draftOwnerLetterIntroWithAnthropic } from "./anthropic";
import { draftOwnerLetterIntroWithGemini } from "./gemini";
import type { LetterDraftInput } from "./prompt";

export async function draftOwnerLetterIntro(input: LetterDraftInput) {
  const provider = process.env.LLM_PROVIDER ?? "gemini";

  if (provider === "anthropic") {
    return draftOwnerLetterIntroWithAnthropic(input);
  }

  return draftOwnerLetterIntroWithGemini(input);
}
