import { useEffect, useMemo, useRef } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
// @ts-expect-error — cytoscape-fcose ships without type declarations
import fcose from 'cytoscape-fcose';
import type { CytoscapeElement } from '../lib/tagGraph';

cytoscape.use(fcose);

interface GraphCanvasProps {
  elements: CytoscapeElement[];
  /** Called once the Cytoscape instance is mounted, so the parent can drive viewport/fit actions. */
  onReady?: (cy: Core) => void;
  onNodeSelect?: (id: string) => void;
  className?: string;
}

const STYLE: cytoscape.StylesheetCSS[] = [
  {
    selector: 'node.file',
    css: {
      'background-color': 'data(color)',
      label: 'data(label)',
      'font-size': '11px',
      color: '#1f2937',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 6,
      'text-background-color': '#ffffff',
      'text-background-opacity': 0.85,
      'text-background-padding': '2px',
      'text-background-shape': 'roundrectangle',
      width: 18,
      height: 18,
      'border-color': '#374151',
      'border-width': 1,
      'border-opacity': 0.35,
    },
  },
  {
    selector: 'node.dir',
    css: {
      label: 'data(label)',
      'font-size': '12px',
      'font-weight': 600,
      color: '#6b7280',
      'text-valign': 'top',
      'text-halign': 'center',
      'text-margin-y': -4,
      'background-color': '#f3f4f6',
      'background-opacity': 0.45,
      'border-color': '#d1d5db',
      'border-width': 1,
      'border-style': 'dashed',
      'padding-top': '16px',
      'padding-bottom': '16px',
      'padding-left': '16px',
      'padding-right': '16px',
      shape: 'round-rectangle',
    },
  },
  {
    selector: 'edge.tag-edge',
    css: {
      'line-color': '#9ca3af',
      'line-style': 'dashed',
      width: 1,
      'curve-style': 'bezier',
      opacity: 0.6,
    },
  },
  {
    selector: 'edge.file-link',
    css: {
      'line-color': '#f97316',
      width: 1.5,
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle',
      'target-arrow-color': '#f97316',
      'arrow-scale': 0.9,
      opacity: 0.85,
    },
  },
  {
    selector: 'node:selected',
    css: {
      'border-color': '#f97316',
      'border-width': 2,
      'border-opacity': 1,
    },
  },
];

const LAYOUT = {
  name: 'fcose',
  quality: 'default' as const,
  animate: false,
  packComponents: true,
  nodeRepulsion: 4500,
  idealEdgeLength: 80,
  padding: 32,
  randomize: true,
};

export function GraphCanvas({ elements, onReady, onNodeSelect, className }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  // Cast elements once; Cytoscape's ElementDefinition type is looser than ours
  const cytoscapeElements = useMemo(() => elements as unknown as ElementDefinition[], [elements]);

  // Mount / unmount Cytoscape instance
  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: cytoscapeElements,
      style: STYLE,
      layout: LAYOUT,
      wheelSensitivity: 0.3,
      minZoom: 0.2,
      maxZoom: 3,
    });
    cyRef.current = cy;
    onReady?.(cy);

    if (onNodeSelect) {
      cy.on('tap', 'node.file', (evt) => {
        onNodeSelect(evt.target.id());
      });
    }

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Diff elements in-place to avoid a full remount on every data change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.elements().remove();
      cy.add(cytoscapeElements);
    });
    cy.layout(LAYOUT).run();
  }, [cytoscapeElements]);

  return <div ref={containerRef} className={className ?? 'h-full w-full'} />;
}
