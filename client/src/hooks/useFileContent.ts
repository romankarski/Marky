import { useState, useEffect } from 'react';

export function useFileContent(filePath: string | null) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) { setContent(null); return; }
    setLoading(true);
    fetch(`/api/files/${filePath}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => { setContent(data.content); setError(null); })
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, [filePath]);

  return { content, loading, error };
}
