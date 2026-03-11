import { visit } from 'unist-util-visit';
import type { Root } from 'hast';

/**
 * Rehype plugin that stamps `data-source-line` on every block-level hast element
 * that has position data. Used by useScrollSync to map preview elements to editor lines.
 */
export function rehypeSourceLines() {
  return (tree: Root) => {
    visit(tree, 'element', (node) => {
      if (node.position?.start.line) {
        node.properties ??= {};
        node.properties['dataSourceLine'] = node.position.start.line;
      }
    });
  };
}
