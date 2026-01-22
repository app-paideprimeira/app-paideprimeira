/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* 🎯 Cores de marca */
        primary: "#1E3A8A",       // azul confiável (marca)
        secondary: "#10B981",     // verde acolhedor / positivo

        /* 🧱 Estrutura */
        background: "#F9FAFB",    // fundo geral
        surface: "#FFFFFF",       // cards / caixas
        border: "#E5E7EB",        // bordas suaves

        /* ✍️ Texto */
        text: {
          primary: "#111827",     // texto principal
          secondary: "#6B7280",   // texto secundário
        },
      },

      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
