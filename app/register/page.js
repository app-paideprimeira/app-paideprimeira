// app/register/page.js
"use client";
import Link from "next/link";
import { useState } from "react";


export default function RegisterPage() {
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");


const handleRegister = (e) => {
e.preventDefault();
console.log("Cadastro:", name, email, password);
};


return (
<div>
<h1 className="text-2xl font-bold mb-4 text-center">Criar Conta</h1>
<form onSubmit={handleRegister} className="space-y-4">
<input
type="text"
placeholder="Seu nome"
className="w-full border rounded-lg px-3 py-2"
value={name}
onChange={(e) => setName(e.target.value)}
/>


<input
type="email"
placeholder="Seu e-mail"
className="w-full border rounded-lg px-3 py-2"
value={email}
onChange={(e) => setEmail(e.target.value)}
/>


<input
type="password"
placeholder="Crie uma senha"
className="w-full border rounded-lg px-3 py-2"
value={password}
onChange={(e) => setPassword(e.target.value)}
/>


<button
type="submit"
className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
>
Registrar
</button>
</form>


<p className="mt-4 text-center text-sm">
Já tem conta?{" "}
<Link href="/login" className="text-blue-600 hover:underline">
Fazer login
</Link>
</p>
</div>
);
}