"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "خانه" },
  { href: "/products", label: "محصولات" },
  { href: "/command-center", label: "مرکز فرماندهی" },
  { href: "/owner/licenses", label: "مجوزها" },
  { href: "/dana/ai-workspace", label: "دانا" },
  { href: "/future-lab", label: "آزمایشگاه آینده" }
];

export default function VayroNavigation() {
  const pathname = usePathname();
  if (["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/resend-verification"].some(path => pathname.startsWith(path))) return null;
  return (
    <nav className="vayro-global-nav" aria-label="ناوبری اصلی وایرو">
      <Link href="/" className="vayro-nav-brand"><span>V</span><b>VAYRO</b></Link>
      <div className="vayro-nav-links">
        {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}
      </div>
      <Link className="vayro-nav-owner" href="/owner">ورود مالک</Link>
    </nav>
  );
}
