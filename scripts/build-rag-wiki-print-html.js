#!/usr/bin/env node
/**
 * Erzeugt eine druckfertige HTML-Datei aus RAG-Pipeline-Wiki.md
 * mit gerenderten Mermaid-Diagrammen (wie Cursor-Preview).
 * Öffne die HTML im Browser → Cmd/Ctrl+P → "Als PDF speichern".
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const mdPath = path.join(root, '.github/docs2/RAG-Pipeline-Wiki.md');
const outPath = path.join(root, '.github/docs2/RAG-Pipeline-Wiki-print.html');

const markdown = readFileSync(mdPath, 'utf8');
// Verhindern, dass </script> im Markdown den HTML-Script-Block schließt
const escaped = markdown.replace(/<\/script/gi, '<\\/script');

const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RAG-Systemarchitektur (Event-Driven) – Druckansicht</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    :root { --bg: #1e1e1e; --fg: #d4d4d4; --border: #3c3c3c; --accent: #4ec9b0; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.6;
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
    }
    h1 { font-size: 1.8rem; border-bottom: 1px solid var(--border); padding-bottom: 0.3rem; }
    h2 { font-size: 1.4rem; margin-top: 1.5rem; }
    h3 { font-size: 1.15rem; margin-top: 1.2rem; }
    h4 { font-size: 1rem; margin-top: 1rem; }
    a { color: var(--accent); }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #2d2d2d; }
    pre { background: #2d2d2d; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    code { background: #2d2d2d; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    .doc-meta {
      font-size: 0.85rem;
      color: #9e9e9e;
      margin-bottom: 1rem;
    }
    .mermaid { margin: 1.5rem 0; text-align: center; }
    .mermaid svg { max-width: 100%; }
    hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
    @media print {
      html, body {
        margin: 0 !important;
        background: #1e1e1e !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html { padding: 0 !important; }
      body {
        padding: 15mm 20mm !important;
        min-height: 100vh;
        box-sizing: border-box;
      }
      .mermaid { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div id="content"></div>
  <script type="text/plain" id="md">${escaped}</script>
  <script>
    const md = document.getElementById('md').textContent;

    // IDs für Überschriften exakt wie in der Gliederung (Bindestriche behalten, " & " -> "--")
    function slugify(raw) {
      return raw.toLowerCase()
        .replace(/\\s*&\\s*/g, '--')
        .replace(/[^a-z0-9äöüß\\s-]/g, '')
        .replace(/\\s+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    const renderer = new marked.Renderer();
    const origHeading = renderer.heading.bind(renderer);
    renderer.heading = function (text, level, raw) {
      const id = slugify(raw);
      return '<h' + level + ' id="' + id + '">' + text + '</h' + level + '>';
    };
    renderer.code = function (code, lang) {
      if (lang === 'mermaid') return '<div class="mermaid">' + code + '</div>';
      return '<pre><code class="language-' + (lang || '') + '">' + escapeHtml(code) + '</code></pre>';
    };
    function escapeHtml(s) {
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    marked.setOptions({ renderer: renderer, gfm: true });
    const htmlBody = marked.parse(md);
    const meta = '<div class="doc-meta"><strong>Autor:</strong> Domenic Schumacher</div>';
    document.getElementById('content').innerHTML = meta + htmlBody;

    // Nachträglich alle mermaid-Codeblöcke in <div class="mermaid"> umwandeln
    document.querySelectorAll('pre code').forEach((codeEl) => {
      const cls = codeEl.className || '';
      if (cls.includes('language-mermaid')) {
        const pre = codeEl.parentElement;
        const div = document.createElement('div');
        div.className = 'mermaid';
        div.textContent = codeEl.textContent;
        pre.replaceWith(div);
      }
    });

    mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
    mermaid.run().then(function () { document.body.dataset.mermaidDone = '1'; }).catch(function (e) {
      console.error('Mermaid:', e);
      document.body.dataset.mermaidDone = '1';
    });
  </script>
</body>
</html>
`;

writeFileSync(outPath, html, 'utf8');
console.log('Erzeugt:', outPath);
console.log('Öffne die Datei im Browser und nutze Cmd/Ctrl+P → "Als PDF speichern".');
