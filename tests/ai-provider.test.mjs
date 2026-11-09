import test from "node:test";
import assert from "node:assert/strict";
import { generateText, generateImage } from "../src/lib/ai-provider.mjs";

const env = {
  VAYRO_AI_BASE_URL: "https://api.example.test",
  VAYRO_AI_API_KEY: "test-key",
  VAYRO_AI_TEXT_MODEL: "text-model",
  VAYRO_AI_IMAGE_MODEL: "image-model"
};
function fakeFetch(payload, status = 200, capture = {}) {
  return async (url, options) => {
    capture.url = url; capture.options = options;
    return { ok: status >= 200 && status < 300, status, json: async () => payload };
  };
}

test("text generation sends authenticated request and returns provider output", async () => {
  const capture = {};
  const result = await generateText({ prompt: "Write a product description" }, env,
    fakeFetch({ choices: [{ message: { content: "A clear product description." } }], usage: { total_tokens: 12 } }, 200, capture));
  assert.equal(result.text, "A clear product description.");
  assert.equal(capture.url, "https://api.example.test/v1/chat/completions");
  assert.equal(capture.options.headers.Authorization, "Bearer test-key");
});

test("image generation accepts only secure provider URLs", async () => {
  const result = await generateImage({ prompt: "A studio product photograph" }, env,
    fakeFetch({ data: [{ url: "https://cdn.example.test/image.png" }] }));
  assert.equal(result.imageUrl, "https://cdn.example.test/image.png");
  await assert.rejects(() => generateImage({ prompt: "A studio product photograph" }, env,
    fakeFetch({ data: [{ url: "http://unsafe.example.test/image.png" }] })), /AI_PROVIDER_RESPONSE_INVALID/);
});

test("provider is fail-closed when credentials or models are absent", async () => {
  await assert.rejects(() => generateText({ prompt: "hello" }, {}, fakeFetch({})), /AI_PROVIDER_NOT_CONFIGURED/);
  await assert.rejects(() => generateImage({ prompt: "hello" }, { ...env, VAYRO_AI_API_KEY: "" }, fakeFetch({})), /AI_PROVIDER_NOT_CONFIGURED/);
  await assert.rejects(() => generateImage({ prompt: "hello" }, { ...env, VAYRO_AI_IMAGE_MODEL: "" }, fakeFetch({})), /AI_IMAGE_MODEL_NOT_CONFIGURED/);
});

test("input and upstream failures are normalized", async () => {
  await assert.rejects(() => generateText({ prompt: "x" }, env, fakeFetch({})), /AI_INPUT_INVALID/);
  await assert.rejects(() => generateText({ prompt: "valid prompt" }, env, fakeFetch({}, 503)), /AI_PROVIDER_UNAVAILABLE/);
});
