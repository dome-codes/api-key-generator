#!/usr/bin/env node
/**
 * Erzeugt aus RAG-Pipeline-Wiki.md:
 * 1. Mermaid-Blöcke -> Einzelne .mmd-Dateien -> SVG via mermaid-cli
 * 2. RAG-Pipeline-Wiki-for-pdf.md mit Bildreferenzen statt Mermaid
 * 3. PDF via Pandoc (wenn installiert)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';
import http from 'http';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, '.github/docs2');
const mdPath = path.join(docsDir, 'RAG-Pipeline-Wiki.md');
const outMdPath = path.join(docsDir, 'RAG-Pipeline-Wiki-for-pdf.md');
const pdfPath = path.join(docsDir, 'RAG-Pipeline-Wiki-pandoc.pdf');
const texPath = path.join(docsDir, 'RAG-Pipeline-Wiki.tex');
const diagramsDir = path.join(docsDir, 'diagrams');

const md = readFileSync(mdPath, 'utf8');

// Slug-Logik wie in der HTML-Print-Variante, damit Links in der Gliederung
// exakt zu den Überschriften-IDs passen. Wird nach dem Rendern angewendet.
function slugify(raw) {
  return raw
    .toLowerCase()
    .replace(/\s*&\s*/g, '--')
    .replace(/[^a-z0-9äöüß\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}
marked.setOptions({ gfm: true });

// Alle ```mermaid ... ``` Blöcke finden
const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
let match;
const blocks = [];
while ((match = mermaidRegex.exec(md)) !== null) {
  blocks.push({ content: match[1].trim(), index: match.index, fullLength: match[0].length });
}

if (blocks.length === 0) {
  console.log('Keine Mermaid-Blöcke gefunden.');
  process.exit(0);
}

mkdirSync(diagramsDir, { recursive: true });

// Jeden Block als .mmd speichern und durch Bildreferenz ersetzen
let outMd = md;
let offset = 0;
for (let i = 0; i < blocks.length; i++) {
  const { content, index, fullLength } = blocks[i];
  const name = `diagram-${String(i + 1).padStart(2, '0')}`;
  const mmdPath = path.join(diagramsDir, `${name}.mmd`);
  const svgPath = path.join(diagramsDir, `${name}.svg`);
  writeFileSync(mmdPath, content, 'utf8');

  const imgRef = `\n![Diagramm ${i + 1}](diagrams/${name}.svg)\n`;
  const start = index + offset;
  outMd = outMd.slice(0, start) + imgRef + outMd.slice(start + fullLength);
  offset += imgRef.length - fullLength;
}

writeFileSync(outMdPath, outMd, 'utf8');
console.log('Erzeugt:', outMdPath, `(${blocks.length} Diagramme durch Bilder ersetzt)`);

// Zusätzlich: LaTeX-Datei für manuelle PDF-Erzeugung (mit klickbarer Gliederung)
try {
  execSync(
    `pandoc "${outMdPath}" -o "${texPath}" --toc --toc-depth=3 -V toc-title="Gliederung" -V documentclass=article -V papersize=a4 -V geometry:margin=2cm --resource-path="${docsDir}"`,
    { cwd: root, stdio: 'inherit' }
  );
  console.log('LaTeX erzeugt:', texPath);
} catch (e) {
  console.warn('Pandoc LaTeX-Ausgabe fehlgeschlagen:', e.message);
}

// Mermaid-CLI: mmdc für jede .mmd
try {
  for (let i = 0; i < blocks.length; i++) {
    const name = `diagram-${String(i + 1).padStart(2, '0')}`;
    const mmdPath = path.join(diagramsDir, `${name}.mmd`);
    const svgPath = path.join(diagramsDir, `${name}.svg`);
    execSync(`npx mmdc -i "${mmdPath}" -o "${svgPath}" -b transparent`, {
      cwd: root,
      stdio: 'inherit',
    });
  }
  console.log('SVGs erzeugt in', diagramsDir);
} catch (e) {
  console.warn('mmdc fehlgeschlagen (z. B. Puppeteer):', e.message);
  console.warn('SVGs manuell erzeugen: npx mmdc -i .github/docs2/diagrams/diagram-XX.mmd -o .github/docs2/diagrams/diagram-XX.svg');
}

// Pandoc PDF: zuerst xelatex, sonst pdflatex
const pandocCmd = (engine) =>
  `pandoc "${outMdPath}" -o "${pdfPath}" --pdf-engine=${engine} --toc --toc-depth=3 -V toc-title="Gliederung" -V documentclass=article -V papersize=a4 -V geometry:margin=2cm --resource-path="${docsDir}"`;
let pdfOk = false;
for (const engine of ['xelatex', 'pdflatex', 'lualatex']) {
  try {
    execSync(pandocCmd(engine), { cwd: root, stdio: 'inherit' });
    console.log('PDF erzeugt:', pdfPath);
    pdfOk = true;
    break;
  } catch (e) {
    const msg = (e.message || '') + (e.stderr ? String(e.stderr) : '');
    if (e.status !== 47 && !msg.includes('not found')) throw e;
  }
}
if (!pdfOk) {
  const pdfPathPuppeteer = path.join(docsDir, 'RAG-Pipeline-Wiki.pdf');
  try {
    const rawHtml = await marked.parse(outMd);
    const bodyHtml = rawHtml.replace(
      /<h([1-6]) id="([^"]*)">([\s\S]*?)<\/h\1>/g,
      (match, level, _oldId, inner) => {
        const plain = inner.replace(/<[^>]+>/g, '');
        const id = slugify(plain);
        return `<h${level} id="${id}">${inner}</h${level}>`;
      }
    );
    const staticHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>RAG-Systemarchitektur (Event-Driven)</title>
  <style>
    :root { --bg: #1e1e1e; --fg: #d4d4d4; --border: #3c3c3c; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--fg); line-height: 1.6; padding: 2rem; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 1.8rem; border-bottom: 1px solid var(--border); padding-bottom: 0.3rem; }
    h2 { font-size: 1.4rem; margin-top: 1.5rem; break-before: page; }
    body h2:first-of-type { break-before: auto; }
    h3 { font-size: 1.15rem; margin-top: 1.2rem; }
    h4 { font-size: 1rem; margin-top: 1rem; }
    a { color: #4ec9b0; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #2d2d2d; }
    pre { background: #2d2d2d; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    code { background: #2d2d2d; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    .doc-meta { font-size: 0.85rem; color: #9e9e9e; margin-bottom: 1rem; }
    img { max-width: 100%; height: auto; margin: 1rem 0; page-break-inside: avoid; break-inside: avoid; }
    @page { margin: 0; }
    @media print { html, body { margin: 0 !important; background: #1e1e1e !important; print-color-adjust: exact !important; } body { padding: 15mm 20mm !important; } }
  </style>
</head>
<body>
  <div class="doc-meta"><strong>Autor:</strong> Domenic Schumacher</div>
  <div id="content">${bodyHtml}</div>
</body>
</html>`;
    const server = http.createServer((req, res) => {
      const u = req.url || '/';
      if (u === '/' || u === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(staticHtml);
        return;
      }
      if (u.startsWith('/diagrams/')) {
        const filePath = path.join(docsDir, u.slice(1));
        if (!filePath.startsWith(docsDir) || !existsSync(filePath)) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
        res.end(readFileSync(filePath));
        return;
      }
      res.writeHead(404);
      res.end();
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const url = 'http://127.0.0.1:' + port + '/';
    const puppeteer = (await import('puppeteer')).default;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));
    await page.pdf({
      path: pdfPathPuppeteer,
      printBackground: true,
      format: 'A4',
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    await browser.close();
    server.close();
    console.log('PDF erzeugt (Puppeteer):', pdfPathPuppeteer);
  } catch (e) {
    console.warn('Puppeteer-PDF fehlgeschlagen:', e.message);
    console.warn('LaTeX installieren: brew install --cask basictex');
  }
}
