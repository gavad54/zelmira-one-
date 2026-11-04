const products = [
  { name: "LEADORA", detail: "توزیع، فروش و عملیات تجاری", tag: "عملیات تجاری" },
  { name: "ARIANA", detail: "حسابداری، مالی و ERP", tag: "مالی و سازمانی" },
  { name: "ARIA", detail: "جامعه، خدمات و بازارگاه", tag: "اجتماعی و خدمات" },
  { name: "ARMIN MARKET", detail: "بازار درخواست و پیشنهاد تأمین‌کنندگان", tag: "بازار تأمین" }
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="ZELMIRA ONE home">
          <span className="brand-mark">Z</span>
          <span><strong>ZELMIRA</strong><small>ONE · SIGNATURE</small></span>
        </a>
        <span className="topbar-note">هوشمندی، بدون مرز</span>
      </header>

      <section className="hero">
        <div className="eyebrow"><span className="status-dot" /> اکوسیستم یکپارچه زلمیرا</div>
        <h1>یک مرکز هوشمند،<br /><span>بی‌نهایت امکان.</span></h1>
        <p className="hero-copy">
          از یک نقطه، محصولات و ابزارهای زلمیرا را بشناسید، مدیریت کنید و
          به‌تدریج به یک تجربه هوشمند و هماهنگ متصل شوید.
        </p>
        <div className="hero-actions">
          <a className="primary-action" href="#products">مشاهده محصولات <span aria-hidden="true">←</span></a>
          <a className="secondary-action" href="/growth">صفحات هوشمند و رشد فروش</a>
        </div>
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
      </section>

      <section className="section" id="products">
        <div className="section-heading">
          <div><span className="eyebrow">PRODUCT ECOSYSTEM</span><h2>محصولات مستقل، تجربه‌ای هماهنگ</h2></div>
          <p>هر محصول تخصص و مرز اطلاعاتی خود را حفظ می‌کند.</p>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.name}>
              <span className="product-tag">{product.tag}</span>
              <h3>{product.name}</h3>
              <p>{product.detail}</p>
              <span className="card-foot">درگاه محصول <span aria-hidden="true">↗</span></span>
            </article>
          ))}
        </div>
      </section>

      <section className="vision" id="vision">
        <span className="eyebrow">ZELMIRA INTELLIGENCE</span>
        <h2>فناوری در خدمت تصمیم بهتر.</h2>
        <p>مدیریت دسترسی، هماهنگی سرویس‌ها و اتوماسیون هوشمند با امنیت، شفافیت و کنترل انسانی.</p>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} ZELMIRA ONE</span>
        <span>INTELLIGENCE. WITHOUT LIMITS.</span>
      </footer>
    </main>
  );
}