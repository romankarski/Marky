import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: false,
    htmlLabels: false,
    padding: 20,
  },
});

let idCounter = 0;

interface Props {
  code: string;
}

export function MermaidDiagram({ code }: Props) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const id = useRef(`mermaid-${++idCounter}`);

  useEffect(() => {
    let cancelled = false;
    setError('');
    mermaid.render(id.current, code.trim())
      .then(({ svg: rendered }) => {
        if (!cancelled) setSvg(rendered);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Diagram error');
      });
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-mono">
        Mermaid error: {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-400">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      className="mermaid-diagram my-2 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
