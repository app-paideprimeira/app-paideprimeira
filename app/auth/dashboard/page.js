"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import Button from "../../components/Button";

export default function Dashboard() {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth/login");
      } else {
        setUserEmail(session.user.email);
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (loading) {
    return <p className="p-6 text-center">Carregando...</p>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">Bem-vindo, {userEmail}!</h1>
      <p className="mb-6">Você está logado com Supabase.</p>

      <Button onClick={handleLogout} className="bg-red-600 text-white">
        Sair
      </Button>
    </div>
  );
}
