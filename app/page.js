"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../lib/supabase/client";


export default function HomePage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/login");
      } else {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  return (
    <div className="p-6 text-center">
      <p>Verificando sessão...</p>
    </div>
  );
}
