// app/layout.js
import "./globals.css";


export const metadata = {
title: "Pai de Primeira",
description: "Apoio para pais de primeira viagem",
};


export default function RootLayout({ children }) {
return (
<html lang="pt-br">
<body className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
<div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6">
{children}
</div>
</body>
</html>
);
}