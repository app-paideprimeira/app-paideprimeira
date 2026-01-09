import "../styles/globals.css";


export const metadata = {
title: "App - Pai de Primeira",
description: "Apoio prático para pais iniciantes",
};


export default function RootLayout({ children }) {
return (
<html lang="pt-BR">
<body className="bg-gray-100 text-gray-900">{children}</body>
</html>
);
}