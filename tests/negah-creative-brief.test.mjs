import test from "node:test";
import assert from "node:assert/strict";
import { buildCreativeBrief, validateCreativeBrief } from "../src/lib/negah-creative-brief.mjs";
const valid={project:"کمپین محصول",format:"instagram-post",audience:"مشتریان فروشگاه",message:"معرفی ویژگی محصول",style:"مدرن و مینیمال",brandColors:"سرمه‌ای و طلایی",requiredElements:"لوگو و عنوان",avoid:"ادعای اثبات‌نشده"};
test("creative brief includes production specs, rights and supplied requirements",()=>{
  assert.equal(validateCreativeBrief(valid).valid,true);
  const brief=buildCreativeBrief(valid);
  for(const key of ["project","audience","message","style","brandColors","requiredElements","avoid"]) assert.ok(brief.includes(valid[key]));
  assert.match(brief,/پست اینستاگرام · ۱۰۸۰×۱۰۸۰/);
  assert.match(brief,/کنترل حقوق و کیفیت/);
});
test("creative brief rejects unsupported format and oversized fields",()=>{
  assert.equal(validateCreativeBrief({...valid,format:"unknown"}).valid,false);
  assert.equal(validateCreativeBrief({...valid,avoid:"x".repeat(1201)}).valid,false);
});
test("creative brief supplies safe defaults",()=>{
  const brief=buildCreativeBrief({...valid,brandColors:"",requiredElements:"",avoid:""});
  assert.match(brief,/مطابق هویت برند/);
  assert.match(brief,/دارایی‌های مجاز/);
});
