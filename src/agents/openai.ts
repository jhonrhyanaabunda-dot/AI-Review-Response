import OpenAI from "openai";
import { isMockMode, mockChatJson, mockChatText } from "./openai-mock";

export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const PRIMARY_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";
export const FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL ?? "gpt-4o-mini";

export type CompletionResult = {
  content: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
};

/**
 * Routes to the real OpenAI when OPENAI_API_KEY is set, otherwise to a
 * deterministic mock generator (see `openai-mock.ts`). This keeps the agent
 * graph and Regenerate button fully functional in demo/prototype mode.
 */
export async function chatJson<T>(opts: {
  system: string;
  user: string;
  schema?: object;
  temperature?: number;
  model?: string;
}): Promise<T & { _meta: CompletionResult }> {
  if (isMockMode() || !openai) {
    return mockChatJson<T>(opts);
  }
  const model = opts.model ?? PRIMARY_MODEL;
  const completion = await openai.chat.completions.create({
    model,
    temperature: opts.temperature ?? 0.2,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    response_format: { type: "json_object" },
  });

  const choice = completion.choices[0];
  const content = choice?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as T;
  return {
    ...parsed,
    _meta: {
      content,
      model,
      tokensIn: completion.usage?.prompt_tokens ?? 0,
      tokensOut: completion.usage?.completion_tokens ?? 0,
    },
  };
}

export async function chatText(opts: {
  system: string;
  user: string;
  temperature?: number;
  model?: string;
}): Promise<CompletionResult> {
  if (isMockMode() || !openai) {
    return mockChatText(opts);
  }
  const model = opts.model ?? PRIMARY_MODEL;
  const completion = await openai.chat.completions.create({
    model,
    temperature: opts.temperature ?? 0.4,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  });
  return {
    content: completion.choices[0]?.message?.content ?? "",
    model,
    tokensIn: completion.usage?.prompt_tokens ?? 0,
    tokensOut: completion.usage?.completion_tokens ?? 0,
  };
}
