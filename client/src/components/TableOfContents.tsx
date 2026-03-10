import { useEffect, useState, useRef } from 'react';

interface Heading {
  id: string;
  level: number;
  text: string;
}

interface Props {
  content: string;   // raw markdown string (same value passed to MarkdownPreview)
  onHeadingClick?: (id: string) => void;
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
    // Disconnect previous observer before reconnecting (pitfall 7 from research)
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    // Observe all heading elements rendered by MarkdownPreview in the same document
    const els = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
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
                if (onHeadingClick) {
                  onHeadingClick(h.id);
                } else {
                  document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
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
