/**
 * Export utilities for Marky documents.
 *
 * PDF  — renders MarkdownPreview into a hidden #print-root div, triggers window.print().
 * HTML — renders MarkdownPreview into a detached node, downloads self-contained HTML.
 * MD   — downloads the raw markdown source as-is.
 */

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { MarkdownPreview } from '../components/MarkdownPreview';

/** Grab the Tailwind/prose CSS from the page so exported HTML is self-contained. */
function collectStyles(): string {
  return Array.from(document.styleSheets)
    .flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((r) => r.cssText);
      } catch {
        return [];
      }
    })
    .join('\n');
}

function basename(filePath: string): string {
  return filePath.split('/').pop()?.replace(/\.md$/, '') ?? 'document';
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Poll until every .mermaid-diagram div contains an <svg> (or 3s timeout).
 * MermaidDiagram renders async via useEffect so we can't just use rAF.
 */
function waitForMermaid(container: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    function check() {
      const pending = Array.from(container.querySelectorAll('.mermaid-diagram')).filter(
        (el) => !el.querySelector('svg'),
      );
      if (pending.length === 0 || Date.now() - start > 3000) {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    }
    check();
  });
}

/**
 * Render MarkdownPreview into a detached div and return its article innerHTML.
 * Uses requestAnimationFrame to let React flush before reading the DOM.
 */
function renderPreviewHtml(content: string, filePath: string): Promise<string> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(
      createElement(MarkdownPreview, {
        content,
        filePath,
        onLinkClick: () => {},
      }),
    );

    // Wait for React to commit, then poll until all mermaid diagrams have rendered their SVG.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        waitForMermaid(container).then(() => {
          const article = container.querySelector('article');
          const html = article?.innerHTML ?? container.innerHTML;
          root.unmount();
          container.remove();
          resolve(html);
        });
      });
    });
  });
}

/**
 * Export as PDF via the browser's native print dialog.
 * Renders MarkdownPreview into a hidden #print-root so the full styled output prints.
 */
export async function exportPdf(content: string, filePath: string) {
  const innerHtml = await renderPreviewHtml(content, filePath);

  let root = document.getElementById('print-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'print-root';
    root.style.display = 'none';
    document.body.appendChild(root);
  }

  root.innerHTML = `<article class="prose prose-orange max-w-none px-6 py-4">${innerHtml}</article>`;

  const afterPrint = () => {
    if (root) root.innerHTML = '';
    window.removeEventListener('afterprint', afterPrint);
  };
  window.addEventListener('afterprint', afterPrint);

  setTimeout(() => window.print(), 100);
}

/**
 * Export as a self-contained HTML file with full prose styling.
 */
export async function exportHtml(content: string, filePath: string) {
  const innerHtml = await renderPreviewHtml(content, filePath);
  const name = basename(filePath);
  const styles = collectStyles();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>
  <style>
    ${styles}
    body { background: white; padding: 2rem 3rem; max-width: 860px; margin: 0 auto; }
  </style>
</head>
<body>
  <article class="prose prose-orange max-w-none px-6 py-4">
    ${innerHtml}
  </article>
</body>
</html>`;

  triggerDownload(new Blob([html], { type: 'text/html' }), `${name}.html`);
}

/**
 * Download the raw markdown source.
 */
export function exportMarkdown(content: string, filePath: string) {
  const name = basename(filePath);
  triggerDownload(new Blob([content], { type: 'text/markdown' }), `${name}.md`);
}
