import withPWAInit from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const isMobileBuild = process.env.NEXT_OUTPUT === "export";

const withPWA = withPWAInit({
  dest: "public",
  disable: isMobileBuild || process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const withNextIntl = createNextIntlPlugin(
  "./src/shared/i18n/request.ts"
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  output: isMobileBuild ? "export" : "standalone",
  trailingSlash: isMobileBuild,
}

// Configuración de Sentry
const sentryConfig = {
  org: "seoe",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

export default withSentryConfig(withPWA(withNextIntl(nextConfig)), sentryConfig);
