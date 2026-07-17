import OpenAI from "openai";

let client: OpenAI | null = null;

// Groq exposes an OpenAI-compatible /chat/completions endpoint, so the
// official openai SDK works unmodified against it — just a different
// baseURL and API key. Shared by the RAG chat assistant and resume parsing.
export function getGroqClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set");
    }
    client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
  }
  return client;
}
