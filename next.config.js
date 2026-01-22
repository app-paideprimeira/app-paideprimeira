const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  importScripts:["/custom-sw.js"],

  // ✅ IGNORA ARQUIVOS QUE NÃO EXISTEM NO APP ROUTER
  buildExcludes: [
    /app-build-manifest\.json$/,
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
});
