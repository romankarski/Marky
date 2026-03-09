import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkWikiLink from 'remark-wiki-link';
import rehypeSlug from 'rehype-slug';

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
          [remarkWikiLink, {
            pageResolver: (name: string) => [name],
            hrefTemplate: (permalink: string) => `${permalink}.md`,
          }],
        ]}
        rehypePlugins={[rehypeSlug]}
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

          // Fenced code blocks — plain, no syntax highlighting
          pre: ({ children }) => (
            <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono text-gray-800 leading-relaxed">
              {children}
            </pre>
          ),
          code: ({ className, children, ...props }) => {
            // Block code inside <pre> — let pre handle styling
            if (className?.startsWith('language-')) {
              return <code className="font-mono" {...props}>{children}</code>;
            }
            // Inline code
            return (
              <code className="bg-gray-100 text-gray-800 rounded px-1 py-0.5 text-sm font-mono" {...props}>
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
