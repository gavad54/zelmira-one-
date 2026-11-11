import type { Metadata, Viewport } from "next";
import "./globals.css";
import VayroNavigation from "@/components/vayro-navigation";

// Per-request CSP nonces require dynamic rendering; static HTML cannot carry fresh nonces.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "وایرو | VAYRO",
  description: "درگاه هوشمند محصولات و خدمات مستقل وایرو",
  applicationName: "وایرو",
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090b12"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body><VayroNavigation />{children}</body>
    </html>
  );
}