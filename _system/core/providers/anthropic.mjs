// Provider: the Anthropic API with your own key (ANTHROPIC_API_KEY in .env.local).
// The official SDK, one Messages call, the portrait as the system prompt.

import Anthropic from "@anthropic-ai/sdk";

export const label = "Anthropic API";
export const DEFAULT_MODEL = "claude-opus-5";

// $ per million tokens, input / output. Unknown model = no estimate, never a guess.
const PRICES = {
  "claude-opus-5": [5, 25],
  "claude-sonnet-5": [2, 10],
  "claude-haiku-4-5": [1, 5],
  "claude-opus-4-8": [5, 25],
  "claude-opus-4-7": [5, 25],
  "claude-opus-4-6": [5, 25],
  "claude-sonnet-4-6": [3, 15],
  "claude-fable-5-1": [10, 50],
  "claude-fable-5": [10, 50],
};

export const ready = () => Boolean(process.env.ANTHROPIC_API_KEY);
export const readiness = () => (ready() ? "key set" : "ANTHROPIC_API_KEY is not set in .env.local.");

export async function call({ system, prompt, model, timeoutMs = 300000 }) {
  if (!ready()) throw new Error("ANTHROPIC_API_KEY is not set in .env.local.");
  const id = model || DEFAULT_MODEL;
  const client = new Anthropic({ timeout: timeoutMs, maxRetries: 1 });
  const res = await client.messages.create({
    model: id,
    max_tokens: 4000,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal") throw new Error("the model declined this request");
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const u = res.usage ?? {};
  const price = PRICES[id];
  const cost = price && typeof u.input_tokens === "number"
    ? (u.input_tokens / 1e6) * price[0] + ((u.output_tokens ?? 0) / 1e6) * price[1]
    : null;
  return { text, cost_usd: cost, usage: { in: u.input_tokens ?? null, out: u.output_tokens ?? null }, meta: { stop: res.stop_reason } };
}
