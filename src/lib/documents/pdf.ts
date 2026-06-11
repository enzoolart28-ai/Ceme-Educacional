import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface PdfContent {
  title: string;
  subtitle?: string;
  bodyParagraphs: string[];
  footerLines?: string[];
}

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 56;
const MAX_W = PAGE_W - MARGIN * 2;

function wrap(text: string, font: import("pdf-lib").PDFFont, size: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > MAX_W && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Gera um PDF simples (A4) com cabeçalho institucional, título e corpo. */
export async function buildDocumentPdf(content: PdfContent): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_H - MARGIN;

  // Cabeçalho institucional
  page.drawText("SISTEMA CME EDUCACIONAL", { x: MARGIN, y, size: 16, font: bold, color: rgb(0.15, 0.18, 0.4) });
  y -= 18;
  page.drawText("Rede Particular de Ensino", { x: MARGIN, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 12;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.85),
  });
  y -= 40;

  // Título
  const titleLines = wrap(content.title, bold, 15);
  for (const line of titleLines) {
    page.drawText(line, { x: MARGIN, y, size: 15, font: bold, color: rgb(0.1, 0.1, 0.12) });
    y -= 22;
  }
  if (content.subtitle) {
    y -= 4;
    page.drawText(content.subtitle, { x: MARGIN, y, size: 11, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 20;
  }
  y -= 16;

  // Corpo
  for (const para of content.bodyParagraphs) {
    for (const line of wrap(para, font, 11)) {
      page.drawText(line, { x: MARGIN, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
      y -= 16;
    }
    y -= 10; // espaço entre parágrafos
  }

  // Rodapé
  const footer = content.footerLines ?? [];
  let fy = MARGIN + footer.length * 14;
  for (const line of footer) {
    page.drawText(line, { x: MARGIN, y: fy, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
    fy -= 14;
  }

  return pdf.save();
}
