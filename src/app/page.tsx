import Image from "next/image";
import Link from "next/link";

import { VAYRO_PRODUCTS, PLATFORM_CAPABILITIES, INDEPENDENT_PRODUCTS } from "@/lib/product-directory.mjs";

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
        <div className="eyebrow"><span className="status-dot" /> مرکز فرماندهی اکوسیستم وایرو</div>
        <h1>یک مرکز فرماندهی،<br /><span>یازده محصول مستقل.</span></h1>
        <p className="hero-copy">
          وایرو مدیریت و راهبری کل مجموعه را بر عهده دارد؛ هر اپلیکیشن مالک نرم‌افزار،
          داده، زیرساخت، امنیت و چرخه انتشار مستقل خود است.
        </p>
        <div className="hero-actions">
          <a className="primary-action" href="#products">کشف محصولات <span aria-hidden="true">←</span></a>
          <Link className="secondary-action" href="/growth">راهکارهای رشد کسب‌وکار</Link>
          <Link className="secondary-action" href="/ai-business-suite">قابلیت‌های هوشمند وایرو</Link>
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
          <div><span className="eyebrow">INDEPENDENT APPLICATION PORTFOLIO</span><h2>یازده اپلیکیشن مستقل</h2></div>
          <p>هر محصول به‌صورت مستقل قابل توسعه، استقرار، استفاده، پشتیبانی و عرضه است.</p>
        </div>
        <div className="product-grid">
          {VAYRO_PRODUCTS.map((product) => (
            <article className="product-card" key={product.name}>
              <span className="product-tag">{product.tag}</span>
              <span className={`product-status ${product.statusClass}`}>{product.status}</span>
              <h3>{product.href ? <Link href={product.href}>{product.name}</Link> : product.name}</h3>
              <strong className="product-fa">{product.fa}</strong>
              <p>{product.detail}</p>
              <span className="card-foot">اپلیکیشن مستقل <span aria-hidden="true">✦</span></span>
            </article>
          ))}
        </div>
      </section>

      <section className="section independent-section">
        <div className="section-heading">
          <div><span className="eyebrow">INDEPENDENT PRODUCTS</span><h2>سایر اپلیکیشن‌های مستقل</h2></div>
          <p>این محصولات نیز هم‌سطح سایر اپلیکیشن‌ها هستند و زیرمجموعه اجرایی یکدیگر نیستند.</p>
        </div>
        <div className="independent-grid">
          {INDEPENDENT_PRODUCTS.map((product) => (
            <article className="independent-card" key={product.name}>
              <h3>{product.name}</h3><p>{product.detail}</p><span className={`product-status ${product.statusClass}`}>{product.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="platform-capabilities-title">
        <div className="section-heading">
          <div><span className="eyebrow">VAYRO PLATFORM CAPABILITIES</span><h2 id="platform-capabilities-title">قابلیت‌های مرکزی وایرو</h2></div>
          <p>قابلیت‌های مشترک پلتفرم با اپلیکیشن‌های مستقل اشتباه گرفته نمی‌شوند.</p>
        </div>
        <div className="product-grid">
          {PLATFORM_CAPABILITIES.map((capability) => (
            <article className="product-card" key={capability.name}>
              <span className="product-tag">{capability.tag}</span>
              <span className={`product-status ${capability.statusClass}`}>{capability.status}</span>
              <h3><Link href={capability.href}>{capability.name}</Link></h3>
              <strong className="product-fa">{capability.fa}</strong>
              <p>{capability.detail}</p>
              <span className="card-foot">قابلیت پلتفرمی VAYRO <span aria-hidden="true">✦</span></span>
            </article>
          ))}
        </div>
      </section>

      <section className="vision" id="vision">
        <span className="eyebrow">VAYRO COMMAND & GOVERNANCE</span>
        <h2>مدیریت یکپارچه؛ استقلال کامل محصولات.</h2>
        <p>وایرو وضعیت و حاکمیت مجموعه را مدیریت می‌کند، اما داده و عملیات تخصصی هر محصول را در اختیار همان محصول باقی می‌گذارد.</p>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} VAYRO</span>
        <span>INTELLIGENCE. WITHOUT LIMITS.</span>
      </footer>
    </main>
  );
}
