import { useEffect, useRef } from 'react';

export function useAutoSave(
  path: string,
  content: string,
  onSaved: (content: string) => void,
  enabled: boolean,
  delayMs = 800,
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await fetch(`/api/files/${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      onSaved(content);
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, path, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}
