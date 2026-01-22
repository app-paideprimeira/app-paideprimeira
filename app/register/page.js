// app/register/page.js
"use client";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";


export default function RegisterPage() {
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");


const handleRegister = (e) => {
e.preventDefault();
console.log("Cadastro:", name, email, password);
};


return (
<div className="min-h-screen bg-[#1E3A8A] flex flex-col items-center justify-start px-4 pt-10">
          
                {/* LOGO NO FUNDO AZUL */}
                <div className="mb-8">
                  <Image
                    src="/logo/logo-app.svg"
                    alt="Pai de Primeira"
                    width={400}
                    height={200}
                    className="w-72 mx-auto drop-shadow-md"
                    priority
                  />
                </div>
    <div>
    <h1 className="text-2xl font-bold text-white mb-8 text-center">
        Criar Conta
    </h1>
    
    <h2 className="text-xl font-light text-white mb-8 text-center">
        Seja bem-vindo.<br/>
        Este espaço foi feito para te apoiar em cada fase dessa linda jornada
    </h2>

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
    className="w-full bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 transition"
    >
    Registrar
    </button>
    </form>


    <p className="mt-6 text-center text-sm">
    Já tem conta?{" "}
    <Link href="/login" className="text-blue-600 hover:underline">
    Fazer login
    </Link>
    </p>
    </div>
</div>
);
}