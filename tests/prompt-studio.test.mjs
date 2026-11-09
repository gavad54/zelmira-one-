import test from "node:test";
import assert from "node:assert/strict";
import { buildBusinessPrompt, validateBusinessPromptInput } from "../src/lib/prompt-studio.mjs";

const valid = {
  business: "فروشگاه آنلاین پوشاک",
  goal: "بهبود توضیحات محصول",
  audience: "مشتریان فروشگاه",
  tone: "حرفه‌ای و روشن",
  context: "فروش لباس روزمره",
  constraints: "از ادعای ساختگی خودداری شود",
  outputFormat: "سه نسخه و جمع‌بندی"
};

test("prompt builder includes every supplied business requirement", () => {
  assert.equal(validateBusinessPromptInput(valid).valid, true);
  const prompt = buildBusinessPrompt(valid);
  for (const value of Object.values(valid)) assert.ok(prompt.includes(value));
  assert.match(prompt, /کنترل نهایی/);
});

test("prompt builder supplies safe defaults for missing optional context", () => {
  const prompt = buildBusinessPrompt({ ...valid, context: "", constraints: "" });
  assert.match(prompt, /اطلاعات تکمیلی ارائه نشده است/);
  assert.match(prompt, /ادعاهای بدون پشتوانه/);
});

test("validator rejects missing, short and oversized fields", () => {
  assert.equal(validateBusinessPromptInput(null).valid, false);
  assert.equal(validateBusinessPromptInput({ ...valid, goal: "x" }).valid, false);
  assert.equal(validateBusinessPromptInput({ ...valid, context: "x".repeat(3001) }).valid, false);
});
