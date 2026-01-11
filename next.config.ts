import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.hollywoodreporter.com",
      },
    ],
  },
  turbopack: {
    // Fix Turbopack incorrectly inferring the root when multiple lockfiles exist on Windows
    // (e.g. a package-lock.json in a parent directory with spaces in the path).
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
