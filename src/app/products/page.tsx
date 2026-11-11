import Link from "next/link";
import { ALL_PRODUCTS, VAYRO_CAPABILITIES } from "@/lib/product-directory.mjs";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return <main className="vayro-console" dir="rtl">
    <header className="console-heading"><span className="eyebrow">VAYRO PRODUCT PORTFOLIO</span><h1>خانواده محصولات وایرو</h1><p>یازده محصول مستقل با مرزبندی روشن داده، مسئولیت و معیار انتشار. ثبت در فهرست به معنی آماده‌بودن برای فروش یا انتشار نیست.</p></header>
    <div className="portfolio-summary"><strong>۱۱ محصول</strong><span>۷ محصول خانواده پلتفرم + ۴ محصول مستقل</span><span>دانا قابلیت مرکزی است، نه محصول دوازدهم</span></div>
    <section className="portfolio-grid" aria-label="یازده محصول">
      {ALL_PRODUCTS.map((product,index) => <article className="portfolio-card" key={product.name}>
        <div className="portfolio-card-top"><span>{String(index+1).padStart(2,"0")}</span><small>{index<7?"خانواده پلتفرم":"محصول مستقل"}</small></div>
        <h2>{product.name}</h2><p>{product.detail}</p><div className="portfolio-card-status">{product.status}</div>
      </article>)}
    </section>
    <section className="capability-card portfolio-dana"><div><span className="eyebrow">CENTRAL AI CAPABILITY</span><h2>DANA · دانا</h2><p>{VAYRO_CAPABILITIES[0].detail}؛ دسترسی به داده و عملیات محصولات فقط با مجوز محدود و قابل ممیزی.</p></div><Link className="secondary-action" href="/dana/ai-workspace">ورود به فضای دانا</Link></section>
    <p className="console-footnote">هیچ محصولی از این صفحه فعال یا منتشر نمی‌شود. وضعیت عملیاتی هر محصول باید با شواهد فنی و تأیید انتشار مستقل تعیین شود.</p>
  </main>;
}
