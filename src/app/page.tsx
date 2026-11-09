import Image from "next/image";
import Link from "next/link";

import { VAYRO_PRODUCTS, INDEPENDENT_PRODUCTS } from "@/lib/product-directory.mjs";

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="خانه وایرو">
          <Image className="brand-mark" src="/vayro-mark.svg" alt="" width={46} height={46} priority />
          <span><strong>وایرو</strong><small>VAYRO</small></span>
        </Link>
        <nav className="home-auth-nav" aria-label="حساب کاربری"><Link href="/login">ورود</Link><Link href="/register">ساخت حساب</Link></nav>
      </header>

      <section className="hero">
        <div className="eyebrow"><span className="status-dot" /> اکوسیستم فناوری وایرو</div>
        <h1>یک جهان هوشمند،<br /><span>در یک تجربه.</span></h1>
        <p className="hero-copy">
          وایرو نقطه اتصال محصولات تخصصی برای تجارت، بازار، خلاقیت و فناوری است.
          هر محصول مستقل عمل می‌کند و در صورت نیاز، با دسترسی کنترل‌شده به اکوسیستم متصل می‌شود.
        </p>
        <div className="hero-actions">
          <a className="primary-action" href="#products">کشف محصولات <span aria-hidden="true">←</span></a>
          <Link className="secondary-action" href="/growth">راهکارهای رشد کسب‌وکار</Link>
          <Link className="secondary-action" href="/ai-business-suite">۵۰ قابلیت هوشمند وایرو</Link>
          <Link className="secondary-action" href="/dana/ai-workspace">فضای کار هوشمند دانا</Link>
          <Link className="secondary-action" href="/dana/prompt-studio">استودیوی پرامپت دانا</Link>
          <Link className="secondary-action" href="/negah/creative-studio">استودیوی تولید تصویر نگاه</Link>
          <Link className="secondary-action" href="/negah/creative-brief">بریف خلاقیت نگاه</Link>
        </div>
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
      </section>

      <section className="section" id="products">
        <div className="section-heading">
          <div><span className="eyebrow">VAYRO PRODUCT FAMILY</span><h2>۱۱ اپلیکیشن تخصصی، یک اکوسیستم</h2></div>
          <p>هر محصول برای یک نیاز مشخص طراحی شده است؛ دسترسی و خرید محصولات مستقل خواهد بود.</p>
        </div>
        <div className="product-grid">
          {VAYRO_PRODUCTS.map((product) => (
            <article className="product-card" key={product.name}>
              <span className="product-tag">{product.tag}</span>
              <span className={`product-status ${product.statusClass}`}>{product.status}</span>
              <h3>{product.href ? <Link href={product.href}>{product.name}</Link> : product.name}</h3>
              <strong className="product-fa">{product.fa}</strong>
              <p>{product.detail}</p>
              <span className="card-foot">محصول خانواده وایرو <span aria-hidden="true">✦</span></span>
            </article>
          ))}
        </div>
      </section>

      <section className="section independent-section">
        <div className="section-heading">
          <div><span className="eyebrow">INDEPENDENT PRODUCTS</span><h2>محصولات مستقل و متصل</h2></div>
          <p>محصولات تخصصی موجود، هویت و مرز داده‌ای مستقل خود را حفظ می‌کنند.</p>
        </div>
        <div className="independent-grid">
          {INDEPENDENT_PRODUCTS.map((product) => (
            <article className="independent-card" key={product.name}>
              <h3>{product.name}</h3><p>{product.detail}</p><span className={`product-status ${product.statusClass}`}>{product.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="vision" id="vision">
        <span className="eyebrow">VAYRO INTELLIGENCE</span>
        <h2>فناوری در خدمت تصمیم بهتر.</h2>
        <p>وایرو مسیر یکپارچه‌ای برای کشف و مدیریت محصولات فراهم می‌کند؛ بدون ادغام ناخواسته داده‌ها یا حذف استقلال هر کسب‌وکار.</p>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} VAYRO</span>
        <span>INTELLIGENCE. WITHOUT LIMITS.</span>
      </footer>
    </main>
  );
}
