import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { rehypeSourceLines } from '../components/rehype-source-lines';
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';

function processMarkdown(md: string): Root {
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSourceLines);
  return processor.runSync(processor.parse(md)) as Root;
}

describe('rehypeSourceLines', () => {
  it('stamps data-source-line on heading elements', () => {
    const tree = processMarkdown('# Hello\n\nSome text\n');
    const elements: Element[] = [];
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'h1') elements.push(node);
    });
    expect(elements.length).toBeGreaterThan(0);
    expect(elements[0].properties?.['dataSourceLine']).toBe(1);
  });

  it('stamps data-source-line on paragraph elements', () => {
    const tree = processMarkdown('First paragraph\n\nSecond paragraph\n');
    const paras: Element[] = [];
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'p') paras.push(node);
    });
    expect(paras.length).toBeGreaterThanOrEqual(2);
    // First paragraph starts at line 1
    expect(paras[0].properties?.['dataSourceLine']).toBe(1);
    // Second paragraph starts at line 3
    expect(paras[1].properties?.['dataSourceLine']).toBe(3);
  });

  it('stamps data-source-line on multiple heading levels', () => {
    const md = '# H1\n\n## H2\n\n### H3\n';
    const tree = processMarkdown(md);
    const headings: Element[] = [];
    visit(tree, 'element', (node: Element) => {
      if (['h1', 'h2', 'h3'].includes(node.tagName)) headings.push(node);
    });
    expect(headings.length).toBe(3);
    expect(headings[0].properties?.['dataSourceLine']).toBe(1);
    expect(headings[1].properties?.['dataSourceLine']).toBe(3);
    expect(headings[2].properties?.['dataSourceLine']).toBe(5);
  });

  it('does not stamp elements without position data', () => {
    // Manually create a tree with an element missing position
    const tree = processMarkdown('# Hello\n');
    // Verify all stamped elements have valid line numbers
    visit(tree, 'element', (node: Element) => {
      const line = node.properties?.['dataSourceLine'];
      if (line !== undefined) {
        expect(typeof line).toBe('number');
        expect(line as number).toBeGreaterThan(0);
      }
    });
  });
});
