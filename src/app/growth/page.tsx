import "./growth.css";

const steps = [
  { number: "01", title: "شناخت مخاطب", detail: "تعریف گروه هدف، نیاز واقعی، زبان و منطقه فعالیت" },
  { number: "02", title: "ساخت صفحه اختصاصی", detail: "تولید نسخه‌های متناسب با محصول و کانال تبلیغاتی" },
  { number: "03", title: "بازبینی و انتشار", detail: "تأیید انسانی، کنترل ادعاها و انتشار نسخه تأییدشده" },
  { number: "04", title: "اندازه‌گیری نتیجه", detail: "تحلیل سرنخ معتبر، تبدیل، هزینه و کیفیت تجربه" }
];

const programs = [
  { name: "LEADORA", event: "فروش یا اشتراک معتبر نرم‌افزار", rule: "بدون پاداش صرفاً بابت عضوگیری" },
  { name: "ARIANA", event: "خرید مجوز یا تمدید پشتیبانی", rule: "بدون الزام خرید بسته یا رتبه" },
  { name: "ARIA", event: "تراکنش واجد شرایط خدمات یا بازارگاه", rule: "بدون پاداش بابت ساخت حساب یا آگهی" },
  { name: "ARMIN MARKET", event: "خدمت پولی معتبر در صورت فعال‌سازی", rule: "بدون پاداش بابت دعوت تأمین‌کننده" },
  { name: "ARVAND", event: "قرارداد واقعی خدمات یا نرم‌افزار", rule: "بدون پاداش بابت عضوگیری" }
];

export default function GrowthPage() {
  return (
    <main className="page-shell growth-page">
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-mark">V</span><span><strong>وایرو</strong><small>VAYRO</small></span></a>
        <a className="secondary-action" href="/">بازگشت به خانه</a>
      </header>
      <section className="growth-hero">
        <span className="eyebrow">NAMA × PAYAM</span>
        <h1>هر مخاطب،<br /><span>یک تجربه اختصاصی.</span></h1>
        <p>صفحات فرود هوشمند برای معرفی محصولات، جذب سرنخ باکیفیت و سنجش شفاف نتیجه کمپین‌ها؛ همراه با برنامه معرفی مشتری مبتنی بر فروش واقعی.</p>
        <div className="growth-labels"><span>AI-assisted content</span><span>Human approval</span><span>Conversion analytics</span></div>
      </section>
      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">NAMA WORKFLOW</span><h2>از شناخت مخاطب تا بهبود تبدیل</h2></div></div>
        <div className="growth-steps">
          {steps.map((step) => <article className="growth-step" key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.detail}</p></article>)}
        </div>
      </section>
      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">PAYAM · VERIFIED REFERRALS</span><h2>شبکه معرفی مشتری، نه عضوگیری پولی</h2></div></div>
        <p className="growth-disclaimer">پاداش فقط پس از فروش واقعی و تأییدشده قابل بررسی است؛ عضوگیری به‌تنهایی درآمد ایجاد نمی‌کند. هر طرح چندسطحی تا زمان تأیید حقوقی کشور هدف غیرفعال می‌ماند.</p>
        <div className="program-grid">
          {programs.map((program) => <article className="product-card" key={program.name}><h3>{program.name}</h3><p><strong>رویداد واجد شرایط:</strong> {program.event}</p><p>{program.rule}</p></article>)}
        </div>
      </section>
      <footer className="footer"><span>© {new Date().getFullYear()} VAYRO</span><span>DESIGNED FOR TRUSTED GROWTH</span></footer>
    </main>
  );
}