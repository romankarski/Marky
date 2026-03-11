/**
 * Export utilities for Marky documents.
 *
 * PDF  — renders current MarkdownPreview into a hidden #print-root div,
 *         triggers window.print(), then tears down.
 * HTML — serialises the rendered article to a self-contained HTML file.
 * MD   — downloads the raw markdown source as-is.
 */

/** Grab the Tailwind/prose CSS from the page so exported HTML is self-contained. */
function collectStyles(): string {
  return Array.from(document.styleSheets)
    .flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((r) => r.cssText);
      } catch {
        // Cross-origin sheets (CDN etc.) — skip
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
 * Export as PDF via the browser's native print dialog.
 * Clones the rendered preview article into a hidden div that @media print
 * makes the only visible element, then calls window.print().
 */
export function exportPdf(previewEl: HTMLElement, filePath: string) {
  const article = previewEl.querySelector('article');
  if (!article) return;

  // Create (or reuse) the dedicated print root
  let root = document.getElementById('print-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'print-root';
    root.style.display = 'none';
    document.body.appendChild(root);
  }

  root.innerHTML = article.outerHTML;

  const afterPrint = () => {
    if (root) root.innerHTML = '';
    window.removeEventListener('afterprint', afterPrint);
  };
  window.addEventListener('afterprint', afterPrint);

  // Safari requires a small delay — it won't open the print dialog while
  // network connections (HMR websocket, SSE) are active. setTimeout preserves
  // the user-gesture chain on Safari for delays up to ~1s.
  setTimeout(() => window.print(), 100);
}

/**
 * Export as a self-contained HTML file (works in any browser, opens in Word/LibreOffice).
 */
export function exportHtml(previewEl: HTMLElement, filePath: string) {
  const article = previewEl.querySelector('article');
  if (!article) return;

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
  ${article.outerHTML}
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
