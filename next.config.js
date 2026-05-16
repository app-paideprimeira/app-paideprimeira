const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  importScripts: ["/custom-sw.js"],
  buildExcludes: [
    /app-build-manifest\.json$/,
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── Headers de segurança HTTP ─────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Previne clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Previne MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Força HTTPS por 1 ano (HSTS)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Controla informações enviadas no Referer
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restringe acesso a APIs do browser
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
          // CSP — permite: self, Supabase, Mercado Pago, Google Fonts, YouTube
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://www.youtube.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com https://fcm.googleapis.com https://web.push.apple.com",
              "frame-src 'self' https://www.youtube.com https://www.mercadopago.com.br https://www.mercadopago.com",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);