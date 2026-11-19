import Image from "next/image";
import Link from "next/link";

import {
  FLAGSHIP_APPLICATIONS,
  PORTFOLIO_INITIATIVES,
  VAYRO_CAPABILITIES
} from "@/lib/product-directory.mjs";

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
        <h1>چهار اپ مستقل،<br /><span>یک فرماندهی هوشمند.</span></h1>
        <p className="hero-copy">
          VAYRO مالک و حاکمیت اکوسیستم است. DANA مرکز فرماندهی و هماهنگی مجاز است؛
          ARIA، ARIANA، LEADORA و ARMIN MARKET هرکدام مستقل طراحی، اجرا و منتشر می‌شوند.
        </p>
        <div className="hero-actions">
          <a className="primary-action" href="#flagship-apps">کشف چهار اپ مستقل <span aria-hidden="true">←</span></a>
          <Link className="secondary-action" href="/growth">راهکارهای رشد کسب‌وکار</Link>
          <Link className="secondary-action" href="/ai-business-suite">قابلیت‌های هوشمند وایرو</Link>
          <Link className="secondary-action" href="/dana/ai-workspace">مرکز فرماندهی دانا</Link>
          <Link className="secondary-action" href="/dana/prompt-studio">استودیوی پرامپت دانا</Link>
          <Link className="secondary-action" href="/negah/creative-studio">استودیوی تولید تصویر نگاه</Link>
          <Link className="secondary-action" href="/negah/creative-brief">بریف خلاقیت نگاه</Link>
        </div>
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
      </section>

      <section className="section" id="flagship-apps">
        <div className="section-heading">
          <div><span className="eyebrow">FOUR INDEPENDENT APPLICATIONS</span><h2>چهار اپلیکیشن مستقل زیر فرماندهی دانا</h2></div>
          <p>هر اپ مالک کد، تجربه کاربری، داده، مجوزها، زیرساخت و چرخه انتشار خودش است؛ اتصال فقط از مسیرهای مجاز انجام می‌شود.</p>
        </div>
        <div className="independent-grid">
          {FLAGSHIP_APPLICATIONS.map((product) => (
            <article className="independent-card" key={product.name}>
              <h3>{product.name}</h3>
              <p>{product.detail}</p>
              <span className={`product-status ${product.statusClass}`}>{product.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section capability-section" aria-labelledby="dana-capability-title">
        <div className="capability-card">
          <div>
            <span className="eyebrow">VAYRO COMMAND & ORCHESTRATION</span>
            <h2 id="dana-capability-title">DANA · مرکز فرماندهی وایرو</h2>
            <p>{VAYRO_CAPABILITIES[0].detail}. دانا دسترسی هر اپ را دور نمی‌زند و قطع آن نباید عملیات اصلی اپ‌های مستقل را متوقف کند.</p>
          </div>
          <Link className="secondary-action" href={VAYRO_CAPABILITIES[0].href}>ورود به فضای فرماندهی دانا</Link>
        </div>
      </section>

      <section className="section" id="portfolio-initiatives">
        <div className="section-heading">
          <div><span className="eyebrow">VAYRO PORTFOLIO INITIATIVES</span><h2>سایر ابتکارهای سبد محصولات وایرو</h2></div>
          <p>این ابتکارها در سبد VAYRO حفظ می‌شوند؛ مدل مستقل‌سازی و اتصال هرکدام پس از ممیزی منبع و محصول تعیین می‌شود.</p>
        </div>
        <div className="product-grid">
          {PORTFOLIO_INITIATIVES.map((product) => (
            <article className="product-card" key={product.name}>
              <span className="product-tag">{product.tag}</span>
              <span className={`product-status ${product.statusClass}`}>{product.status}</span>
              <h3>{product.href ? <Link href={product.href}>{product.name}</Link> : product.name}</h3>
              <strong className="product-fa">{product.fa}</strong>
              <p>{product.detail}</p>
              <span className="card-foot">ابتکار سبد وایرو <span aria-hidden="true">✦</span></span>
            </article>
          ))}
        </div>
      </section>

      <section className="vision" id="vision">
        <span className="eyebrow">VAYRO GOVERNANCE</span>
        <h2>استقلال محصول، هماهنگی هوشمند.</h2>
        <p>VAYRO مالک و حاکمیت اکوسیستم است؛ DANA هماهنگ می‌کند و هر اپ مستقل مسئول داده، امنیت و عملیات دامنه خودش باقی می‌ماند.</p>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} VAYRO</span>
        <span>INTELLIGENCE. WITHOUT LIMITS.</span>
      </footer>
    </main>
  );
}
