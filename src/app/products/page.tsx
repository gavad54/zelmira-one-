import Link from "next/link";
import { ALL_PRODUCTS, ARIA_MODULES } from "@/lib/product-directory.mjs";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return <main className="vayro-console" dir="rtl">
    <header className="console-heading"><span className="eyebrow">VAYRO PRODUCT PORTFOLIO</span><h1>خانواده محصولات وایرو</h1><p>پنج زیرمحصول مستقل با مرزبندی روشن داده، مسئولیت و معیار انتشار؛ هفت حوزهٔ قدیمی نیز به‌عنوان ماژول‌های ARIA حفظ شده‌اند.</p></header>
    <div className="portfolio-summary"><strong>۵ زیرمحصول مستقل</strong><span>۵ محصول مستقیم خانواده VAYRO</span><span>۷ ماژول قدیمی با مالکیت ARIA</span></div>
    <section className="portfolio-grid" aria-label="پنج زیرمحصول وایرو">
      {ALL_PRODUCTS.map((product,index) => <article className="portfolio-card" key={product.name}>
        <div className="portfolio-card-top"><span>{String(index+1).padStart(2,"0")}</span><small>زیرمحصول مستقل VAYRO</small></div>
        <h2>{product.name}</h2><p>{product.detail}</p><div className="portfolio-card-status">{product.status}</div>
        {product.href && <Link className="secondary-action" href={product.href}>ورود به فضای محصول ←</Link>}
      </article>)}
    </section>
    <section className="portfolio-grid" aria-label="هفت ماژول آریا">
      {ARIA_MODULES.map((module,index) => <article className="portfolio-card" key={module.name}>
        <div className="portfolio-card-top"><span>{String(index+1).padStart(2,"0")}</span><small>ماژول ARIA</small></div>
        <h2>{module.name}</h2><p>{module.detail}</p><div className="portfolio-card-status">مالک محصول: ARIA</div>
      </article>)}
    </section>
    <section className="capability-card portfolio-dana"><div><span className="eyebrow">COMMAND CENTER</span><h2>DANA · دانا</h2><p>دانا زیرمحصول مستقل و مرکز فرماندهی وایرو است؛ دسترسی آن به داده و عملیات سایر محصولات فقط با مجوز محدود و قابل ممیزی انجام می‌شود.</p></div><Link className="secondary-action" href="/dana/ai-workspace">ورود به مرکز فرماندهی دانا</Link></section>
    <p className="console-footnote">ثبت در کاتالوگ به‌معنای آماده‌بودن برای فروش یا انتشار نیست. وضعیت عملیاتی هر محصول باید با شواهد فنی و تأیید انتشار مستقل تعیین شود.</p>
  </main>;
}
