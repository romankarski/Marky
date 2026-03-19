import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import CodeBlock from '@tiptap/extension-code-block';
import { createElement } from 'react';
import { MermaidDiagram } from '../components/MermaidDiagram';

/**
 * Extends the base CodeBlock to render ```mermaid blocks as live diagrams.
 * Non-mermaid code blocks fall through to a plain <pre><code> view.
 * Round-trip is safe: still serialises as ```mermaid fenced code.
 */
export const MermaidCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView);
  },
});

function MermaidNodeView({ node }: { node: any }) {
  const lang: string = node.attrs.language ?? '';
  const code: string = node.textContent ?? '';

  if (lang === 'mermaid') {
    return createElement(
      NodeViewWrapper,
      { as: 'div', className: 'not-prose' },
      createElement(MermaidDiagram, { code }),
    );
  }

  return createElement(
    NodeViewWrapper,
    { as: 'pre', className: 'bg-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono text-gray-800 leading-relaxed' },
    createElement(NodeViewContent, { as: 'code' }),
  );
}
