import { getGroqClient } from "../lib/groq.js";
import { ragConfig } from "./config.js";
import { buildUserPrompt, SYSTEM_PROMPT } from "./promptTemplate.js";
import type { RetrievedChunk } from "./types.js";

export async function generateGroundedAnswer(
  question: string,
  chunks: RetrievedChunk[],
): Promise<string> {
  const openai = getGroqClient();
  const response = await openai.chat.completions.create({
    model: ragConfig.chatModel,
    temperature: 0,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(question, chunks) },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
