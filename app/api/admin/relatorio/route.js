// app/api/admin/relatorio/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NAVY  = "FF1E3A8A";
const BLUE  = "FF2563EB";
const SOFT  = "FFEFF6FF";
const WHITE = "FFFFFFFF";
const DARK  = "FF0F172A";
const MUTED = "FF64748B";
const GREEN_BG  = "FFDCFCE7";
const GREEN_FG  = "FF166534";
const RED_BG    = "FFFEE2E2";
const RED_FG    = "FF991B1B";
const BEBE_BG   = "FFF0FDF4";
const BEBE_FG   = "FF166534";

const TIPO_LABELS = {
  checklist:      "✅ Checklist",
  texto:          "📝 Texto",
  lembrete_fixo:  "📌 Lembrete",
  video:          "🎥 Vídeo",
  filme:          "🎬 Filme",
  podcast:        "🎧 Podcast",
  audio:          "🔊 Áudio",
  leitura:        "📖 Leitura",
  produto:        "🛒 Produto",
  lista_produtos: "🛍️ Lista de Produtos",
  imagem:         "🖼️ Imagem",
  download:       "📥 Download",
};

function hCell(ws, row, col, value, bgHex, fgHex = WHITE, bold = true, size = 10, hAlign = "center") {
  const cell = ws.getCell(row, col);
  cell.value = value;
  cell.font = { name: "Arial", size, bold, color: { argb: fgHex } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgHex } };
  cell.alignment = { horizontal: hAlign, vertical: "middle", wrapText: true };
  cell.border = {
    top:    { style: "thin", color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    left:   { style: "thin", color: { argb: "FFE2E8F0" } },
    right:  { style: "thin", color: { argb: "FFE2E8F0" } },
  };
  return cell;
}

function dCell(ws, row, col, value, bgHex = WHITE, fgHex = DARK, bold = false, hAlign = "center") {
  return hCell(ws, row, col, value, bgHex, fgHex, bold, 9, hAlign);
}

async function buscarDados() {
  const { data: headers } = await supabase
    .from("premium_week_materials")
    .select("id, stage, week, title")
    .order("stage").order("week");

  if (!headers?.length) return { gestante: {}, bebe: {} };

  const ids = headers.map(h => h.id);
  const { data: blocos } = await supabase
    .from("premium_week_blocks")
    .select("week_id, type, title, description, payload, sort_order")
    .in("week_id", ids)
    .order("sort_order");

  const blocosPorHeader = {};
  for (const b of blocos || []) {
    if (!blocosPorHeader[b.week_id]) blocosPorHeader[b.week_id] = [];
    blocosPorHeader[b.week_id].push(b);
  }

  const dados = { gestante: {}, bebe: {} };
  for (const h of headers) {
    if (!dados[h.stage]) dados[h.stage] = {};
    dados[h.stage][h.week] = {
      titulo: h.title,
      blocos: blocosPorHeader[h.id] || [],
    };
  }
  return dados;
}

function criarAbaResumo(wb, dados) {
  const ws = wb.addWorksheet("📊 Resumo");
  ws.views = [{ showGridLines: false }];

  // Título
  ws.mergeCells("A1:G1");
  hCell(ws, 1, 1, "PAI DE PRIMEIRA — Relatório de Conteúdo Premium", NAVY, WHITE, true, 14);
  ws.getRow(1).height = 36;

  ws.mergeCells("A2:G2");
  const now = new Date().toLocaleString("pt-BR");
  hCell(ws, 2, 1, `Gerado em ${now}`, BLUE, WHITE, false, 9);
  ws.getRow(2).height = 20;

  ws.getRow(3).height = 12;

  // Cards resumo
  const totalG   = Object.values(dados.gestante || {}).reduce((s, v) => s + v.blocos.length, 0);
  const totalB   = Object.values(dados.bebe || {}).reduce((s, v) => s + v.blocos.length, 0);
  const semG     = Object.keys(dados.gestante || {}).length;
  const semB     = Object.keys(dados.bebe || {}).length;
  const vaziasG  = 42 - semG;
  const vaziasB  = 52 - semB;

  const cards = [
    [1, 2, `${semG}`, "Semanas gestante",  SOFT,   NAVY],
    [3, 4, `${totalG}`, "Blocos gestante", SOFT,   NAVY],
    [5, 6, `${semB}`,   "Semanas bebê",    BEBE_BG, BEBE_FG],
    [1, 2, `${totalB}`, "Blocos bebê",     BEBE_BG, BEBE_FG],
    [3, 4, `${vaziasG}`, "Vazias gestante", RED_BG, RED_FG],
    [5, 6, `${vaziasB}`, "Vazias bebê",     RED_BG, RED_FG],
  ];

  const cardRows = [[4,5],[4,5],[4,5],[6,7],[6,7],[6,7]];
  cards.forEach(([c1, c2, val, label, bg, fg], i) => {
    const [r1, r2] = cardRows[i];
    ws.mergeCells(r1, c1 > 4 ? c1 : c1, r2, c2 > 4 ? c2 : c2);
    const cell = ws.getCell(r1, c1);
    cell.value = `${val}\n${label}`;
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: fg } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { top: { style: "thin", color: { argb: "FFE2E8F0" } }, bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, left: { style: "thin", color: { argb: "FFE2E8F0" } }, right: { style: "thin", color: { argb: "FFE2E8F0" } } };
  });
  ws.getRow(4).height = 40; ws.getRow(5).height = 40;
  ws.getRow(6).height = 40; ws.getRow(7).height = 40;
  ws.getRow(8).height = 16;

  // Tabela Gestante
  let row = 9;
  ws.mergeCells(`A${row}:G${row}`);
  hCell(ws, row, 1, "🤰 JORNADA DA GESTANTE — Visão por Semana", NAVY, WHITE, true, 11);
  ws.getRow(row).height = 28; row++;

  const cols = ["Semana", "Status", "Qtd Blocos", "Tipos de Conteúdo", "Preview Gratuito", "Título da Semana", ""];
  cols.forEach((h, i) => { hCell(ws, row, i + 1, h, BLUE, WHITE, true, 9); });
  ws.getRow(row).height = 22; row++;

  for (let s = 1; s <= 42; s++) {
    const sd = dados.gestante?.[s];
    const rowBg = s % 2 === 0 ? WHITE : SOFT;
    if (sd) {
      const blocos  = sd.blocos;
      const tipos   = [...new Set(blocos.map(b => TIPO_LABELS[b.type] || b.type))].join(", ");
      const preview = blocos.filter(b => b.payload?.is_preview).length;
      dCell(ws, row, 1, `Semana ${s}`, rowBg, NAVY, true);
      hCell(ws, row, 2, "✅ Publicada", GREEN_BG, GREEN_FG, true, 9);
      dCell(ws, row, 3, blocos.length, rowBg);
      dCell(ws, row, 4, tipos, rowBg, DARK, false, "left");
      dCell(ws, row, 5, preview > 0 ? `${preview}x` : "—", rowBg);
      dCell(ws, row, 6, sd.titulo, rowBg, DARK, false, "left");
      dCell(ws, row, 7, "", rowBg);
    } else {
      dCell(ws, row, 1, `Semana ${s}`, rowBg, NAVY, true);
      hCell(ws, row, 2, "⬜ Vazia", RED_BG, RED_FG, true, 9);
      [3,4,5,6,7].forEach(c => dCell(ws, row, c, "—", rowBg, MUTED));
    }
    ws.getRow(row).height = 18; row++;
  }

  ws.getRow(row).height = 16; row++;

  // Tabela Bebê
  ws.mergeCells(`A${row}:G${row}`);
  hCell(ws, row, 1, "👶 JORNADA DO BEBÊ — Visão por Semana", BEBE_FG.replace("FF","FF"), WHITE, true, 11);
  ws.getCell(row, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF166534" } };
  ws.getRow(row).height = 28; row++;

  cols.forEach((h, i) => { hCell(ws, row, i + 1, h, "FF166534", WHITE, true, 9); });
  ws.getRow(row).height = 22; row++;

  for (let s = 1; s <= 52; s++) {
    const sd = dados.bebe?.[s];
    const rowBg = s % 2 === 0 ? WHITE : BEBE_BG;
    if (sd) {
      const blocos  = sd.blocos;
      const tipos   = [...new Set(blocos.map(b => TIPO_LABELS[b.type] || b.type))].join(", ");
      const preview = blocos.filter(b => b.payload?.is_preview).length;
      dCell(ws, row, 1, `Semana ${s}`, rowBg, BEBE_FG, true);
      hCell(ws, row, 2, "✅ Publicada", GREEN_BG, GREEN_FG, true, 9);
      dCell(ws, row, 3, blocos.length, rowBg);
      dCell(ws, row, 4, tipos, rowBg, DARK, false, "left");
      dCell(ws, row, 5, preview > 0 ? `${preview}x` : "—", rowBg);
      dCell(ws, row, 6, sd.titulo, rowBg, DARK, false, "left");
      dCell(ws, row, 7, "", rowBg);
    } else {
      dCell(ws, row, 1, `Semana ${s}`, rowBg, BEBE_FG, true);
      hCell(ws, row, 2, "⬜ Vazia", RED_BG, RED_FG, true, 9);
      [3,4,5,6,7].forEach(c => dCell(ws, row, c, "—", rowBg, MUTED));
    }
    ws.getRow(row).height = 18; row++;
  }

  ws.columns = [
    { width: 12 }, { width: 15 }, { width: 12 },
    { width: 48 }, { width: 16 }, { width: 36 }, { width: 4 },
  ];
}

function criarAbaDetalhes(wb, dados, stage, tabName, corHeader, corAlt) {
  const ws = wb.addWorksheet(tabName);
  ws.views = [{ showGridLines: false }];

  ws.mergeCells("A1:F1");
  hCell(ws, 1, 1, `PAI DE PRIMEIRA — ${tabName.toUpperCase()} — Detalhe dos Blocos`, corHeader, WHITE, true, 13);
  ws.getRow(1).height = 34;

  ws.mergeCells("A2:F2");
  hCell(ws, 2, 1, `Gerado em ${new Date().toLocaleString("pt-BR")}`, BLUE, WHITE, false, 9);
  ws.getRow(2).height = 18;

  let row = 4;
  const headers = ["Semana", "Tipo", "Título do Bloco", "Descrição", "Preview Gratuito", "Loop (áudio)"];
  headers.forEach((h, i) => { hCell(ws, row, i + 1, h, corHeader, WHITE, true, 10); });
  ws.getRow(row).height = 24; row++;

  const maxSem = stage === "gestante" ? 42 : 52;
  let alt = false;

  for (let s = 1; s <= maxSem; s++) {
    const sd = dados[stage]?.[s];
    if (!sd?.blocos?.length) continue;

    sd.blocos.forEach((bloco, i) => {
      const isPreview = bloco.payload?.is_preview === true;
      const isLoop    = bloco.payload?.loop === true;
      const rowBg     = alt ? corAlt : WHITE;

      dCell(ws, row, 1, i === 0 ? `Semana ${s}` : "", rowBg, corHeader.replace("FF","FF"), i === 0);
      dCell(ws, row, 2, TIPO_LABELS[bloco.type] || bloco.type, rowBg, DARK, false, "center");
      dCell(ws, row, 3, bloco.title || "", rowBg, DARK, true, "left");
      dCell(ws, row, 4, bloco.description || "", rowBg, MUTED, false, "left");

      const prevCell = ws.getCell(row, 5);
      prevCell.value = isPreview ? "✅ Sim" : "";
      prevCell.font = { name: "Arial", size: 9, bold: isPreview, color: { argb: isPreview ? GREEN_FG : MUTED } };
      prevCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isPreview ? GREEN_BG : rowBg } };
      prevCell.alignment = { horizontal: "center", vertical: "middle" };
      prevCell.border = { top: { style: "thin", color: { argb: "FFE2E8F0" } }, bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, left: { style: "thin", color: { argb: "FFE2E8F0" } }, right: { style: "thin", color: { argb: "FFE2E8F0" } } };

      const loopCell = ws.getCell(row, 6);
      loopCell.value = isLoop ? "🔁 Sim" : "";
      loopCell.font = { name: "Arial", size: 9, bold: isLoop, color: { argb: isLoop ? NAVY : MUTED } };
      loopCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isLoop ? SOFT : rowBg } };
      loopCell.alignment = { horizontal: "center", vertical: "middle" };
      loopCell.border = { top: { style: "thin", color: { argb: "FFE2E8F0" } }, bottom: { style: "thin", color: { argb: "FFE2E8F0" } }, left: { style: "thin", color: { argb: "FFE2E8F0" } }, right: { style: "thin", color: { argb: "FFE2E8F0" } } };

      ws.getRow(row).height = 18; row++;
    });
    alt = !alt;
  }

  ws.columns = [
    { width: 12 }, { width: 22 }, { width: 42 },
    { width: 36 }, { width: 16 }, { width: 14 },
  ];
}

export async function GET() {
  try {
    const dados = await buscarDados();

    const wb = new ExcelJS.Workbook();
    wb.creator     = "Pai de Primeira";
    wb.lastModifiedBy = "Admin";
    wb.created     = new Date();
    wb.modified    = new Date();

    criarAbaResumo(wb, dados);
    criarAbaDetalhes(wb, dados, "gestante", "🤰 Gestante", NAVY,     SOFT);
    criarAbaDetalhes(wb, dados, "bebe",     "👶 Bebê",     "FF166534", BEBE_BG);

    const buffer = await wb.xlsx.writeBuffer();

    const now  = new Date().toISOString().slice(0, 10);
    const nome = `relatorio_conteudo_${now}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nome}"`,
      },
    });
  } catch (err) {
    console.error("Erro ao gerar relatório:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}