import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VAYRO ONE | وایرو وان — هوشمندی، بدون مرز",
  description: "درگاه مرکزی محصولات تخصصی و مستقل اکوسیستم وایرو",
  applicationName: "VAYRO ONE",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090b12"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
