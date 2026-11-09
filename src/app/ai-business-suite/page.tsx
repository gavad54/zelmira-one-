import Link from "next/link";
import "./suite.css";
import { AI_BUSINESS_CAPABILITIES } from "@/lib/ai-business-suite.mjs";

const productNames: Record<string, string> = {
  ARVAND: "اروند", CHARSU: "چهارسو", GANJINEH: "گنجینه", NEGAH: "نگاه",
  SEPEHR: "سپهر", NAMA: "نما", PAYAM: "پیام", DANA: "دانا"
};

const engineNames: Record<string, string> = {
  image: "تصویر", video: "ویدئو", audio: "صوت", media: "رسانه",
  writing: "نویسندگی", document: "اسناد", translation: "ترجمه",
  planning: "برنامه‌ریزی", workflow: "گردش‌کار", marketplace: "بازارگاه",
  agent: "عامل هوشمند", knowledge: "دانش", analytics: "تحلیل",
  learning: "آموزش", data: "داده", builder: "سازنده", marketing: "بازاریابی"
};

const groups = Object.keys(productNames).map(product => ({
  product,
  capabilities: AI_BUSINESS_CAPABILITIES.filter(item => item.product === product)
})).filter(group => group.capabilities.length > 0);

export default function AiBusinessSuitePage() {
  return (
    <main className="page-shell" dir="rtl">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">V</span><span><strong>وایرو</strong><small>VAYRO</small></span></Link>
        <Link className="secondary-action" href="/">بازگشت به صفحه اصلی</Link>
      </header>
      <section className="hero" style={{ minHeight: 320 }}>
        <span className="eyebrow">VAYRO AI BUSINESS SUITE</span>
        <h1>۵۰ قابلیت هوشمند،<br /><span>در خانواده محصولات وایرو.</span></h1>
        <p className="hero-copy">فهرست رسمی قابلیت‌ها، مالک محصول، موتور تخصصی و مدل درآمدی آن‌ها. این صفحه وضعیت واقعی توسعه را نشان می‌دهد و قابلیت آزمایشی یا نمایشی را فعال معرفی نمی‌کند.</p>
      </section>
      <section className="section">
        <div className="section-heading">
          <div><span className="eyebrow">CAPABILITY REGISTRY</span><h2>نقشه قابلیت‌های خانواده VAYRO</h2></div>
          <p>تمام {AI_BUSINESS_CAPABILITIES.length} قابلیت در رجیستری مرکزی ثبت شده‌اند. موتورهای اجرایی و اتصال ارائه‌دهندگان باید جداگانه ساخته و تأیید شوند.</p>
        </div>
        <div className="suite-status" role="status">
          <strong>وضعیت فعلی: برنامه‌ریزی‌شده</strong>
          <span>ثبت در رجیستری به معنی فعال‌بودن سرویس یا امکان خرید آن نیست.</span>
        </div>
        {groups.map(group => (
          <section className="suite-product-group" key={group.product}>
            <div className="suite-product-heading">
              <div><span className="eyebrow">{group.product}</span><h3>{productNames[group.product]}</h3></div>
              <span>{group.capabilities.length} قابلیت</span>
            </div>
            <div className="suite-capability-grid">
              {group.capabilities.map(item => (
                <article className="suite-capability-card" key={item.key}>
                  <span className="suite-number">{String(item.number).padStart(2, "0")}</span>
                  <div className="suite-capability-content">
                    <h4>{item.title}</h4>
                    <p>موتور: {engineNames[item.engine] ?? item.engine}</p>
                    <p>مدل درآمد: {item.revenue}</p>
                  </div>
                  <span className="suite-planned">در صف توسعه</span>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>
      <footer className="footer"><span>© {new Date().getFullYear()} VAYRO</span><span>AI BUSINESS SUITE</span></footer>
    </main>
  );
}
