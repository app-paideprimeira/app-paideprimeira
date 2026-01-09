// app/login/page.js
"use client";
import Link from "next/link";
import { useState } from "react";


export default function LoginPage() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");


const handleLogin = (e) => {
e.preventDefault();
console.log("Login:", email, password);
};


return (
<div>
<h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
<form onSubmit={handleLogin} className="space-y-4">
<input
type="email"
placeholder="Seu e-mail"
className="w-full border rounded-lg px-3 py-2"
value={email}
onChange={(e) => setEmail(e.target.value)}
/>


<input
type="password"
placeholder="Sua senha"
className="w-full border rounded-lg px-3 py-2"
value={password}
onChange={(e) => setPassword(e.target.value)}
/>


<button
type="submit"
className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
>
Entrar
</button>
</form>


<p className="mt-4 text-center text-sm">
Ainda não tem conta?{" "}
<Link href="/register" className="text-blue-600 hover:underline">
Criar conta
</Link>
</p>
</div>
);
}