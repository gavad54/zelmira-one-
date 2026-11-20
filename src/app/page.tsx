import Image from "next/image";
import Link from "next/link";

import { VAYRO_PRODUCTS, ARIA_DOMAINS } from "@/lib/product-directory.mjs";

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
        <div className="eyebrow"><span className="status-dot" /> اکوسیستم مادر وایرو</div>
        <h1>شش اپ مستقل،<br /><span>یک اکوسیستم هوشمند.</span></h1>
        <p className="hero-copy">
          VAYRO اپلیکیشن مادر است. شش محصول مستقل، هرکدام با مالکیت داده، منطق تجاری و چرخه انتشار جداگانه،
          از طریق دسترسی‌های کنترل‌شده با یکدیگر ارتباط می‌گیرند.
        </p>
        <div className="hero-actions">
          <a className="primary-action" href="#products">مشاهده شش اپ مستقل <span aria-hidden="true">←</span></a>
          <Link className="secondary-action" href="/growth">راهکارهای رشد کسب‌وکار</Link>
          <Link className="secondary-action" href="/ai-business-suite">قابلیت‌های هوشمند</Link>
        </div>
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
      </section>

      <section className="section" id="products">
        <div className="section-heading">
          <div><span className="eyebrow">VAYRO DIRECT APPLICATIONS</span><h2>شش محصول مستقل زیرمجموعه وایرو</h2></div>
          <p>مستقل بودن محصول به معنی آماده‌بودن برای انتشار نیست؛ وضعیت هر اپ با شواهد واقعی نمایش داده می‌شود.</p>
        </div>
        <div className="product-grid">
          {VAYRO_PRODUCTS.map((product) => (
            <article className="product-card" key={product.name}>
              <span className="product-tag">{product.tag}</span>
              <span className={`product-status ${product.statusClass}`}>{product.status}</span>
              <h3>{product.name}</h3>
              <strong className="product-fa">{product.fa}</strong>
              <p>{product.detail}</p>
              <span className="card-foot">محصول مستقل خانواده وایرو <span aria-hidden="true">✦</span></span>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="aria-domains">
        <div className="section-heading">
          <div><span className="eyebrow">ARIA INTERNAL DOMAINS</span><h2>چهار حوزه داخلی ARIA</h2></div>
          <p>این حوزه‌ها اپلیکیشن مستقل نیستند و در موجودی شش محصول VAYRO دوباره شمرده نمی‌شوند.</p>
        </div>
        <div className="product-grid">
          {ARIA_DOMAINS.map((domain) => (
            <article className="product-card" key={domain.name}>
              <span className="product-tag">دامنه داخلی ARIA</span>
              <span className={`product-status ${domain.statusClass}`}>{domain.status}</span>
              <h3>{domain.href ? <Link href={domain.href}>{domain.name}</Link> : domain.name}</h3>
              <strong className="product-fa">{domain.fa}</strong>
              <p>{domain.detail}</p>
              <span className="card-foot">زیرمجموعه محصول ARIA <span aria-hidden="true">✦</span></span>
            </article>
          ))}
        </div>
      </section>

      <section className="vision" id="vision">
        <span className="eyebrow">VAYRO INTELLIGENCE</span>
        <h2>استقلال محصول، هماهنگی کنترل‌شده.</h2>
        <p>حسابداری و ERP فقط در ARIANA است؛ تجارت بین‌الملل در ARVAND، بازارگاه در ARMIN MARKET و عملیات رشد در LEADORA مالک مشخص دارند.</p>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} VAYRO</span>
        <span>INTELLIGENCE. WITHOUT LIMITS.</span>
      </footer>
    </main>
  );
}
