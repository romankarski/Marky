import { useEffect, useState, useRef } from 'react';

interface Heading {
  id: string;
  level: number;
  text: string;
}

interface Props {
  content: string;   // raw markdown string (same value passed to MarkdownPreview)
  onHeadingClick?: (id: string, text: string) => void;
}

// Extract headings from markdown string using regex.
// Produces the same id strings that react-markdown generates for heading elements
// (lowercase, spaces → dashes, special chars stripped).
function extractHeadings(markdown: string): Heading[] {
  const lines = markdown.split('\n');
  const headings: Heading[] = [];
  for (const line of lines) {
    const match = /^(#{1,6})\s+(.+)$/.exec(line);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      // Generate id matching react-markdown's default behavior
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      headings.push({ id, level, text });
    }
  }
  return headings;
}

export function TableOfContents({ content, onHeadingClick }: Props) {
  const headings = extractHeadings(content);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Ref to track cleanup across content changes
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setActiveId(null); // reset highlight when file changes
    // Disconnect previous observer before reconnecting (pitfall 7 from research)
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const elId = entry.target.id;
            if (elId) {
              setActiveId(elId);
            } else {
              // Match by text content for TipTap headings without id attrs
              const text = entry.target.textContent?.trim() ?? '';
              const match = headings.find(h => h.text.trim() === text);
              if (match) setActiveId(match.id);
            }
            break;
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    // Observe all heading elements rendered by MarkdownPreview in the same document
    const els = document.querySelectorAll('.ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6, h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
    els.forEach(el => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [content]); // Re-run when content changes (new file opened in active tab)

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-0 p-4 overflow-y-auto h-full">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">On this page</p>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li
            key={h.id}
            style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
          >
            <a
              href={`#${h.id}`}
              className={`block text-sm py-0.5 transition-colors ${
                activeId === h.id
                  ? 'text-orange-600 font-medium'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              onClick={(e) => {
                e.preventDefault();
                setActiveId(h.id);  // optimistic update — highlight immediately on click
                if (onHeadingClick) {
                  onHeadingClick(h.id, h.text);
                } else {
                  const target = document.getElementById(h.id)
                    ?? Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
                         .find(el => el.textContent?.trim() === h.text.trim());
                  target?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
