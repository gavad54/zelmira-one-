type Product = {
  name: string;
  persian: string;
  category: string;
  detail: string;
  status: "ecosystem" | "independent";
  mark: string;
};

const specialistProducts: Product[] = [
  { name: "ARVAND", persian: "اروند", category: "GLOBAL TRADE", detail: "تجارت بین‌الملل، صادرات، واردات و ارتباط با شرکای تجاری", status: "ecosystem", mark: "A" },
  { name: "CHARSU", persian: "چهارسو", category: "MARKETPLACE", detail: "بازارگاه هوشمند برای کشف کالا، خدمات، خریداران و فروشندگان", status: "ecosystem", mark: "C" },
  { name: "GANJINEH", persian: "گنجینه", category: "E-COMMERCE", detail: "فروشگاه‌های دیجیتال، کاتالوگ محصولات و تجارت آنلاین", status: "ecosystem", mark: "G" },
  { name: "NEGAH", persian: "نگاه", category: "CREATIVE STUDIO", detail: "استودیوی خلاقیت، طراحی هویت بصری و تولید محتوای دیجیتال", status: "ecosystem", mark: "N" },
  { name: "SEPEHR", persian: "سپهر", category: "CLOUD & INFRASTRUCTURE", detail: "فضای ابری، ذخیره‌سازی و خدمات زیرساخت دیجیتال", status: "ecosystem", mark: "S" },
  { name: "NAMA", persian: "نما", category: "WEBSITE BUILDER", detail: "ساخت وب‌سایت، صفحات فرود و حضور دیجیتال کسب‌وکار", status: "ecosystem", mark: "N" },
  { name: "PAYAM", persian: "پیام", category: "MARKETING & GROWTH", detail: "بازاریابی، جذب مشتری، تحلیل کمپین و معرفی مبتنی بر فروش واقعی", status: "ecosystem", mark: "P" },
  { name: "DANA", persian: "دانا", category: "AI INTELLIGENCE", detail: "هوش مصنوعی، دستیارهای تخصصی و هماهنگی گردش‌کارها با کنترل دسترسی", status: "ecosystem", mark: "D" }
];

const independentProducts: Product[] = [
  { name: "LEADORA", persian: "لیدورا", category: "DISTRIBUTION & SALES", detail: "توزیع، فروش، انبار و عملیات تجاری", status: "independent", mark: "L" },
  { name: "ARIANA", persian: "آریانا", category: "ACCOUNTING & ERP", detail: "حسابداری، مالی و برنامه‌ریزی منابع سازمانی", status: "independent", mark: "A" },
  { name: "ARIA", persian: "آریا", category: "SOCIAL & SERVICES", detail: "جامعه، آگهی، خدمات و بازارگاه؛ بدون حسابداری و ERP", status: "independent", mark: "A" },
  { name: "ARMIN MARKET", persian: "آرمین مارکت", category: "SUPPLIER MARKET", detail: "ثبت درخواست خریدار و دریافت پیشنهاد تأمین‌کنندگان", status: "independent", mark: "M" }
];

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <div className="card-topline">
        <span className="product-mark" aria-hidden="true">{product.mark}</span>
        <span className={product.status === "independent" ? "product-state independent" : "product-state"}>
          {product.status === "independent" ? "محصول مستقل" : "عضو اکوسیستم"}
        </span>
      </div>
      <span className="product-category">{product.category}</span>
      <h3>{product.name}</h3>
      <span className="product-persian">{product.persian}</span>
      <p>{product.detail}</p>
      <span className="card-foot">معرفی محصول <span aria-hidden="true">↗</span></span>
    </article>
  );
}

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="VAYRO ONE home">
          <span className="brand-mark">V</span>
          <span><strong>VAYRO</strong><small>ONE · SIGNATURE</small></span>
        </a>
        <span className="topbar-note">هوشمندی، بدون مرز</span>
      </header>

      <section className="hero">
        <div className="hero-copy-block">
          <div className="eyebrow"><span className="status-dot" /> اکوسیستم فناوری وایرو</div>
          <h1>یک جهان فناوری،<br /><span>در یک نقطه.</span></h1>
          <p className="hero-copy">
            وایرو وان، درگاه مرکزی مجموعه‌ای از محصولات تخصصی و مستقل است؛
            از تجارت و بازارگاه تا زیرساخت ابری و هوش مصنوعی.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#products">کشف محصولات <span aria-hidden="true">←</span></a>
            <a className="secondary-action" href="#platform">معماری وایرو</a>
          </div>
        </div>
        <div className="hero-emblem" aria-hidden="true">
          <div className="emblem-orbit orbit-a" />
          <div className="emblem-orbit orbit-b" />
          <div className="emblem-core">V</div>
          <span className="emblem-caption">INTELLIGENCE · CONNECTED</span>
        </div>
      </section>

      <section className="section" id="products">
        <div className="section-heading">
          <div><span className="eyebrow">VAYRO PRODUCT ECOSYSTEM</span><h2>هشت تخصص، یک اکوسیستم</h2></div>
          <p>هر محصول برای یک مأموریت مشخص طراحی می‌شود و مرز داده و مسئولیت مستقل خود را حفظ می‌کند.</p>
        </div>
        <div className="product-grid">
          {specialistProducts.map((product) => <ProductCard key={product.name} product={product} />)}
        </div>
      </section>

      <section className="section independent-section" id="independent">
        <div className="section-heading">
          <div><span className="eyebrow">INDEPENDENT PRODUCTS</span><h2>محصولات مستقل همکار</h2></div>
          <p>این محصولات هویت، مخزن، داده و چرخه انتشار مستقل خود را حفظ می‌کنند.</p>
        </div>
        <div className="product-grid independent-grid">
          {independentProducts.map((product) => <ProductCard key={product.name} product={product} />)}
        </div>
      </section>

      <section className="vision" id="platform">
        <span className="eyebrow">VAYRO ONE · CENTRAL PLATFORM</span>
        <h2>اتصال هوشمند؛ بدون ادغام اجباری.</h2>
        <p>
          وایرو وان لایه مرکزی هویت، دسترسی، مجوزها و هماهنگی است.
          محصولات تخصصی پایگاه داده و منطق کسب‌وکار مستقل دارند؛ اتصال‌ها فقط از مسیر API نسخه‌دار،
          مجوز محدود و ثبت رویدادهای قابل ممیزی انجام می‌شوند.
        </p>
        <div className="platform-pillars">
          <span>هویت و مجوزها</span><span>حریم خصوصی و کنترل داده</span><span>هوش مصنوعی با نظارت</span><span>ممیزی و امنیت</span>
        </div>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} VAYRO ONE</span>
        <span>INTELLIGENCE. WITHOUT LIMITS.</span>
      </footer>
    </main>
  );
}
