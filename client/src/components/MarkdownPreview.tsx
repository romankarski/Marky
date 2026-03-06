import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkWikiLink from 'remark-wiki-link';
import { ShikiHighlighter } from 'react-shiki';

interface Props {
  content: string;
  // Called when user clicks an internal .md link or [[wiki-link]]
  // Receives the resolved file path (relative to root) — caller opens a tab
  onLinkClick: (path: string) => void;
}

export function MarkdownPreview({ content, onLinkClick }: Props) {
  return (
    <article className="prose prose-orange max-w-none px-6 py-4">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkFrontmatter,
          // remark-wiki-link: maps [[PageName]] to a link with href = PageName.md
          // pageResolver and hrefTemplate are the v2 API
          [remarkWikiLink, {
            pageResolver: (name: string) => [name],
            hrefTemplate: (permalink: string) => `${permalink}.md`,
          }],
        ]}
        components={{
          // Suppress frontmatter YAML node — remark-frontmatter parses it but
          // react-markdown still renders unknown node types unless explicitly silenced
          // @ts-expect-error — 'yaml' is a custom node type injected by remark-frontmatter
          yaml: () => null,

          // Internal link routing: .md relative paths and wiki-link hrefs call onLinkClick
          a: ({ href, children, ...props }) => {
            if (href && (href.endsWith('.md') || href.startsWith('./'))) {
              return (
                <a
                  href="#"
                  className="text-orange-600 hover:text-orange-800 underline"
                  onClick={(e) => { e.preventDefault(); onLinkClick(href); }}
                >
                  {children}
                </a>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-800 underline" {...props}>
                {children}
              </a>
            );
          },

          // Syntax-highlighted fenced code blocks via Shiki (github-light theme)
          // github-light chosen per Claude's discretion — complements the warm white background
          code: ({ className, children, ...props }) => {
            const lang = /language-(\w+)/.exec(className || '')?.[1];
            if (lang && typeof children === 'string') {
              return (
                <ShikiHighlighter language={lang} theme="github-light">
                  {children}
                </ShikiHighlighter>
              );
            }
            // Inline code — no highlighting
            return (
              <code className="bg-orange-50 text-orange-800 rounded px-1 py-0.5 text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },

          // Local images: browser blocks file:// when served from localhost.
          // Defer proxy to Phase 4. Show a placeholder alt text instead of a broken image icon.
          img: ({ src, alt }) => {
            const isRemote = src && (src.startsWith('http://') || src.startsWith('https://'));
            if (isRemote) return <img src={src} alt={alt} className="max-w-full rounded-lg" />;
            return (
              <span className="inline-flex items-center gap-1 text-sm text-gray-400 italic">
                [{alt ?? 'image'}]
              </span>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
