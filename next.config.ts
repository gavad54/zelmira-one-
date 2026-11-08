import type { NextConfig } from "next";

const isCloudflareVinextBuild = process.env.VAYRO_CLOUDFLARE_BUILD === "1";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  // Voice input may be offered by the first-party application; camera and
  // geolocation remain disabled unless a separately reviewed feature needs them.
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" }
];

const nextConfig: NextConfig = {
  // Keep the existing Node/Railway standalone output unchanged. Vinext builds
  // its own Cloudflare output and must not try to emit a Next standalone bundle.
  ...(!isCloudflareVinextBuild ? { output: "standalone" as const } : {}),
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    const headers = [...securityHeaders];
    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=15552000"
      });
    }
    return [{ source: "/(.*)", headers }];
  }
};

export default nextConfig;
