// app/api/admin/query/route.js
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function POST(request) {
  const body = await request.json();
  const { action, payload } = body;
  const supabase = getServiceClient();

  try {
    switch (action) {

      case "loadWeek": {
        const { stage, week } = payload;
        const { data: header } = await supabase
          .from("premium_week_materials")
          .select("id, title, intro")
          .eq("stage", stage)
          .eq("week", week)
          .maybeSingle();

        let blocks = [];
        if (header) {
          const { data: bs } = await supabase
            .from("premium_week_blocks")
            .select("*")
            .eq("week_id", header.id)
            .order("sort_order", { ascending: true });
          blocks = bs ?? [];
        }

        const { data: notif } = await supabase
          .from("week_notifications")
          .select("*")
          .eq("stage", stage)
          .eq("week", week)
          .maybeSingle();

        return NextResponse.json({ header, blocks, notif });
      }

      case "saveHeader": {
        const { headerId, stage, week, title, intro } = payload;
        if (headerId) {
          const { data } = await supabase
            .from("premium_week_materials")
            .update({ title, intro, updated_at: new Date().toISOString() })
            .eq("id", headerId)
            .select().single();
          return NextResponse.json({ header: data });
        } else {
          const { data } = await supabase
            .from("premium_week_materials")
            .insert({ stage, week, title, intro })
            .select().single();
          return NextResponse.json({ header: data });
        }
      }

      case "saveBlock": {
        const { block, weekId, blocksCount } = payload;
        if (block.id) {
          await supabase.from("premium_week_blocks")
            .update({
              type: block.type, title: block.title, description: block.description,
              url: block.url || null, cta: block.cta || null,
              payload: block.payload, sort_order: block.sort_order,
            })
            .eq("id", block.id);
        } else {
          await supabase.from("premium_week_blocks")
            .insert({
              week_id: weekId, type: block.type, title: block.title,
              description: block.description, url: block.url || null,
              cta: block.cta || null, payload: block.payload,
              sort_order: blocksCount + 1,
            });
        }
        return NextResponse.json({ ok: true });
      }

      case "deleteBlock": {
        await supabase.from("premium_week_blocks").delete().eq("id", payload.blockId);
        return NextResponse.json({ ok: true });
      }

      case "reorderBlocks": {
        const { blocks } = payload;
        await Promise.all(blocks.map((b, i) =>
          supabase.from("premium_week_blocks").update({ sort_order: i + 1 }).eq("id", b.id)
        ));
        return NextResponse.json({ ok: true });
      }

      case "saveNotif": {
        const { notifId, stage, week, title, body, url } = payload;
        if (notifId) {
          await supabase.from("week_notifications")
            .update({ title, body, url, updated_at: new Date().toISOString() })
            .eq("id", notifId);
          return NextResponse.json({ notifId });
        } else {
          const { data } = await supabase.from("week_notifications")
            .insert({ stage, week, title, body, url })
            .select().single();
          return NextResponse.json({ notifId: data?.id });
        }
      }

      default:
        return NextResponse.json({ error: "Action não reconhecida" }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}