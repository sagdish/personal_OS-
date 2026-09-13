// Provider: any service with an OpenAI-compatible chat endpoint (OpenAI, Gemini, OpenRouter,
// Ollama, and others). base_url and model come from os.yaml; the key is OS_PROVIDER_KEY in
// .env.local (Ollama needs none). Unverified against each service; the request shape is the
// standard one.

export const label = "OpenAI-compatible endpoint";

export const ready = () => Boolean(process.env.OS_PROVIDER_KEY || process.env.OS_PROVIDER_BASE_URL);
export const readiness = () => (ready() ? "configured" : "OS_PROVIDER_KEY is not set in .env.local.");

export async function call({ system, prompt, model, baseUrl, timeoutMs = 300000 }) {
  const base = (baseUrl || process.env.OS_PROVIDER_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  if (!model) throw new Error("provider.model is empty in os.yaml. Name the model this endpoint serves.");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers = { "content-type": "application/json" };
  if (process.env.OS_PROVIDER_KEY) headers.authorization = `Bearer ${process.env.OS_PROVIDER_KEY}`;
  let res;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`${res.status} from ${base}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  const text = j.choices?.[0]?.message?.content ?? "";
  const u = j.usage ?? {};
  return { text: String(text), cost_usd: null, usage: { in: u.prompt_tokens ?? null, out: u.completion_tokens ?? null }, meta: {} };
}
