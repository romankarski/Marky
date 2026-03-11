import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkWikiLink from 'remark-wiki-link';
import rehypeSlug from 'rehype-slug';
import { rehypeSourceLines } from './rehype-source-lines';

interface Props {
  content: string;
  // Called when user clicks an internal .md link or [[wiki-link]]
  // Receives the resolved file path (relative to root) — caller opens a tab
  onLinkClick: (path: string) => void;
  // Path of the currently-open file (relative to rootDir), used to resolve
  // relative image paths (e.g. ./screenshot.png → docs/screenshot.png)
  filePath: string;
}

export function MarkdownPreview({ content, onLinkClick, filePath }: Props) {
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
        rehypePlugins={[rehypeSlug, rehypeSourceLines]}
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

          // Local images: route through /api/image proxy with correct path resolution.
          img: ({ src, alt }) => {
            if (!src) return null;

            // Remote URLs (http/https): render directly, no proxy
            const isRemote = src.startsWith('http://') || src.startsWith('https://');
            if (isRemote) return <img src={src} alt={alt} className="max-w-full rounded-lg" />;

            // Absolute OS paths (start with /Users/, /home/, etc.): pass as-is
            const OS_PREFIXES = ['/Users/', '/home/', '/root/', '/var/', '/private/'];
            const isAbsoluteOS = OS_PREFIXES.some((p) => src.startsWith(p));

            let resolvedPath: string;
            if (isAbsoluteOS) {
              // Absolute OS path: pass directly to proxy
              resolvedPath = src;
            } else if (src.startsWith('/')) {
              // Root-relative path (e.g. /assets/photo.png): pass as-is to proxy
              // Server strips the leading '/' and resolves relative to rootDir
              resolvedPath = src;
            } else {
              // Relative path (./img.png, ../assets/photo.jpg, img.png):
              // Resolve against the directory of the currently-open file
              const dir = filePath.includes('/')
                ? filePath.substring(0, filePath.lastIndexOf('/'))
                : '';
              // Strip leading './' if present before URL normalization
              const rawSrc = src.startsWith('./') ? src.slice(2) : src;
              // Use URL constructor to normalize '../' segments
              const normalized = new URL(rawSrc, `file:///dummy/${dir}/`);
              // Extract pathname and strip the leading '/dummy/' prefix
              resolvedPath = normalized.pathname.slice('/dummy/'.length);
            }

            const proxyUrl = `/api/image?path=${encodeURIComponent(resolvedPath)}`;
            return <img src={proxyUrl} alt={alt} className="max-w-full rounded-lg" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
