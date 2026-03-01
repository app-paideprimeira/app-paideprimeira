"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function DebugPremium() {
  const [result, setResult] = useState({ loading: true });

  useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();

        // 1) testa header
        const { data: header, error: headerError } = await supabase
          .from("premium_week_materials")
          .select("id, stage, week, title, intro")
          .eq("stage", "gestante")
          .eq("week", 1)
          .maybeSingle();

        // 2) testa blocks (se tiver header)
        let blocks = null;
        let blocksError = null;

        if (header?.id) {
          const res = await supabase
            .from("premium_week_blocks")
            .select("type, title, description, url, cta, payload, sort_order")
            .eq("week_id", header.id)
            .order("sort_order", { ascending: true });

          blocks = res.data;
          blocksError = res.error;
        }

        setResult({
          loading: false,
          header,
          headerError: headerError ? String(headerError.message || headerError) : null,
          blocks,
          blocksError: blocksError ? String(blocksError.message || blocksError) : null,
        });
      } catch (e) {
        setResult({ loading: false, fatal: String(e) });
      }
    })();
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "monospace" }}>
      <h1>Debug Premium (RLS)</h1>
      <p>Testando: gestante semana 1</p>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
