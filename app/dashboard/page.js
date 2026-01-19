"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";

export default function Dashboard() {
  const router = useRouter();
  const supabase = supabaseBrowser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolve() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete, stage, current_week")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.onboarding_complete) {
        router.replace("/onboarding");
        return;
      }

      router.replace(
        `/semanas/${profile.stage}/${profile.current_week}`
      );
    }

    resolve();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}
