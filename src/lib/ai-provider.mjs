const DEFAULT_TIMEOUT_MS = 45_000;
const MAX_TEXT_LENGTH = 12_000;

function providerConfig(env = process.env) {
  const base = env.VAYRO_AI_BASE_URL;
  const apiKey = env.VAYRO_AI_API_KEY;
  if (!base || !apiKey) throw new Error("AI_PROVIDER_NOT_CONFIGURED");
  let url;
  try { url = new URL(base); } catch { throw new Error("AI_PROVIDER_CONFIGURATION_INVALID"); }
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new Error("AI_PROVIDER_CONFIGURATION_INVALID");
  }
  return { base: url.toString().replace(/\/$/, ""), apiKey };
}

async function providerRequest(path, body, env = process.env, fetchImpl = fetch) {
  const { base, apiKey } = providerConfig(env);
  const response = await fetchImpl(base + path, {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
  });
  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error("AI_PROVIDER_RATE_LIMITED");
    if (status >= 500) throw new Error("AI_PROVIDER_UNAVAILABLE");
    throw new Error("AI_PROVIDER_REQUEST_REJECTED");
  }
  return response.json();
}

export async function generateText({ prompt, model }, env = process.env, fetchImpl = fetch) {
  if (typeof prompt !== "string" || prompt.trim().length < 2 || prompt.length > MAX_TEXT_LENGTH) {
    throw new Error("AI_INPUT_INVALID");
  }
  // Validate provider credentials first so a wholly unconfigured provider fails
  // closed consistently instead of leaking a secondary missing-model condition.
  providerConfig(env);
  const selectedModel = model || env.VAYRO_AI_TEXT_MODEL;
  if (!selectedModel) throw new Error("AI_TEXT_MODEL_NOT_CONFIGURED");
  const data = await providerRequest("/v1/chat/completions", {
    model: selectedModel,
    messages: [{ role: "user", content: prompt.trim() }],
    temperature: 0.4
  }, env, fetchImpl);
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("AI_PROVIDER_RESPONSE_INVALID");
  return { text: text.trim(), model: selectedModel, usage: data.usage ?? null };
}

export async function generateImage({ prompt, size = "1024x1024" }, env = process.env, fetchImpl = fetch) {
  if (typeof prompt !== "string" || prompt.trim().length < 3 || prompt.length > 4000) {
    throw new Error("AI_INPUT_INVALID");
  }
  // Fail closed consistently when provider credentials are absent.
  providerConfig(env);
  const model = env.VAYRO_AI_IMAGE_MODEL;
  if (!model) throw new Error("AI_IMAGE_MODEL_NOT_CONFIGURED");
  if (!["1024x1024", "1024x1536", "1536x1024"].includes(size)) throw new Error("AI_INPUT_INVALID");
  const data = await providerRequest("/v1/images/generations", {
    model, prompt: prompt.trim(), size, n: 1, response_format: "url"
  }, env, fetchImpl);
  const imageUrl = data?.data?.[0]?.url;
  if (typeof imageUrl !== "string") throw new Error("AI_PROVIDER_RESPONSE_INVALID");
  let parsed;
  try { parsed = new URL(imageUrl); } catch { throw new Error("AI_PROVIDER_RESPONSE_INVALID"); }
  if (parsed.protocol !== "https:") throw new Error("AI_PROVIDER_RESPONSE_INVALID");
  return { imageUrl, model, revisedPrompt: data.data[0].revised_prompt ?? null };
}
