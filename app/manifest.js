export default function manifest() {
  return {
    name: "Pai de Primeira",
    short_name: "PaiDePrimeira",
    start_url: "/",
    display: "standalone",
    background_color: "#F9FAFB",
    theme_color: "#1E3A8A",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
