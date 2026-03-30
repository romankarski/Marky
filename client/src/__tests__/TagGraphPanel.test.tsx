// Wave 0 RED tests — client/src/components/TagGraphPanel.tsx does not exist yet.
// These tests should fail with import errors until Wave 1 creates the component.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TagGraphPanel } from '../components/TagGraphPanel';

type MockGraphNode = {
  id: string;
  path: string;
  label: string;
  tags: string[];
  tagCount: number;
  x?: number;
  y?: number;
};

const forceGraphHarness = vi.hoisted(() => ({
  latestProps: null as Record<string, unknown> | null,
  pauseAnimation: vi.fn(),
  resumeAnimation: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('react-force-graph-2d', async () => {
  const React = await import('react');

  const MockForceGraph2D = React.forwardRef(function MockForceGraph2D(
    props: Record<string, unknown>,
    ref: React.ForwardedRef<unknown>,
  ) {
    forceGraphHarness.latestProps = props;
    React.useImperativeHandle(ref, () => ({
      pauseAnimation: forceGraphHarness.pauseAnimation,
      resumeAnimation: forceGraphHarness.resumeAnimation,
      refresh: forceGraphHarness.refresh,
    }));

    const nodes = ((props.graphData as { nodes?: MockGraphNode[] } | undefined)?.nodes ??
      []) as MockGraphNode[];

    return (
      <div data-testid="force-graph-mock">
        {nodes.map(node => (
          <button
            key={node.id}
            type="button"
            onClick={() =>
              (props.onNodeClick as ((node: MockGraphNode) => void) | undefined)?.(node)
            }
          >
            {node.label}
          </button>
        ))}
      </div>
    );
  });

  return {
    default: MockForceGraph2D,
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  forceGraphHarness.latestProps = null;
  forceGraphHarness.pauseAnimation.mockReset();
  forceGraphHarness.resumeAnimation.mockReset();
  forceGraphHarness.refresh.mockReset();
});

function makeGraphPayload() {
  return {
    nodes: [
      {
        id: 'notes/alpha.md',
        path: 'notes/alpha.md',
        label: 'Alpha',
        tags: ['shared', 'focus'],
        tagCount: 2,
        x: 10,
        y: 20,
      },
      {
        id: 'notes/beta.md',
        path: 'notes/beta.md',
        label: 'Beta',
        tags: ['shared'],
        tagCount: 1,
        x: -10,
        y: -20,
      },
    ],
    links: [
      {
        source: 'notes/alpha.md',
        target: 'notes/beta.md',
        sharedTags: ['shared'],
        weight: 1,
      },
    ],
  };
}

function makeCanvasContextSpy() {
  const arcCalls: number[] = [];
  const fillStyleValues: unknown[] = [];
  const strokeStyleValues: unknown[] = [];
  const lineWidthValues: number[] = [];

  const ctx = {
    beginPath: vi.fn(),
    arc: vi.fn((_: number, __: number, radius: number) => {
      arcCalls.push(radius);
    }),
    fill: vi.fn(),
    stroke: vi.fn(),
  } as Record<string, unknown>;

  Object.defineProperties(ctx, {
    fillStyle: {
      configurable: true,
      set(value: unknown) {
        fillStyleValues.push(value);
      },
    },
    strokeStyle: {
      configurable: true,
      set(value: unknown) {
        strokeStyleValues.push(value);
      },
    },
    lineWidth: {
      configurable: true,
      set(value: number) {
        lineWidthValues.push(value);
      },
    },
  });

  return { ctx, arcCalls, fillStyleValues, strokeStyleValues, lineWidthValues };
}

describe('TagGraphPanel', () => {
  it('fetches /api/graph/tags and shows a loading state while the graph payload is pending', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );

    render(
      <TagGraphPanel
        activeFilePath={null}
        isVisible
        refreshToken={0}
        onOpen={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/graph/tags');
    });
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });

  it('renders an empty-state message when the graph route returns zero nodes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ nodes: [], links: [] }),
      }),
    );

    render(
      <TagGraphPanel
        activeFilePath={null}
        isVisible
        refreshToken={0}
        onOpen={vi.fn()}
      />,
    );

    expect(await screen.findByText(/no graph/i)).toBeTruthy();
  });

  it('clicking a graph node calls onOpen with the node path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeGraphPayload()),
      }),
    );

    const onOpen = vi.fn();
    render(
      <TagGraphPanel
        activeFilePath="notes/alpha.md"
        isVisible
        refreshToken={0}
        onOpen={onOpen}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Alpha' }));
    expect(onOpen).toHaveBeenCalledWith('notes/alpha.md');
  });

  it('draws the active node with a stronger highlight treatment than inactive nodes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeGraphPayload()),
      }),
    );

    render(
      <TagGraphPanel
        activeFilePath="notes/alpha.md"
        isVisible
        refreshToken={0}
        onOpen={vi.fn()}
      />,
    );

    await screen.findByRole('button', { name: 'Alpha' });

    const nodeCanvasObject = forceGraphHarness.latestProps?.nodeCanvasObject as
      | ((node: MockGraphNode, ctx: Record<string, unknown>, scale: number) => void)
      | undefined;

    expect(typeof nodeCanvasObject).toBe('function');

    const activeCtx = makeCanvasContextSpy();
    const inactiveCtx = makeCanvasContextSpy();

    nodeCanvasObject?.(
      {
        id: 'notes/alpha.md',
        path: 'notes/alpha.md',
        label: 'Alpha',
        tags: ['shared', 'focus'],
        tagCount: 2,
        x: 10,
        y: 20,
      },
      activeCtx.ctx,
      2,
    );
    nodeCanvasObject?.(
      {
        id: 'notes/beta.md',
        path: 'notes/beta.md',
        label: 'Beta',
        tags: ['shared'],
        tagCount: 1,
        x: -10,
        y: -20,
      },
      inactiveCtx.ctx,
      2,
    );

    expect(activeCtx.arcCalls[0]).toBeGreaterThan(inactiveCtx.arcCalls[0]);
    expect(activeCtx.fillStyleValues.at(-1)).not.toEqual(inactiveCtx.fillStyleValues.at(-1));
    expect(activeCtx.strokeStyleValues.length).toBeGreaterThan(0);
    expect(activeCtx.lineWidthValues.length).toBeGreaterThan(0);
    expect((activeCtx.ctx.stroke as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
    expect((inactiveCtx.ctx.stroke as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });
});
