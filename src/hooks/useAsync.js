// File: src/hooks/useAsync.js
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useAsync — runs an async function, tracks loading/error/data
 *
 * Usage:
 *   const { data, loading, error, run } = useAsync(fn, { immediate: true });
 */
export function useAsync(asyncFn, { immediate = false, deps = [] } = {}) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError]     = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const run = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      if (mountedRef.current) setData(result);
      return result;
    } catch (err) {
      if (mountedRef.current) setError(err?.message || 'Lỗi không xác định');
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  return { data, loading, error, run, setData };
}
