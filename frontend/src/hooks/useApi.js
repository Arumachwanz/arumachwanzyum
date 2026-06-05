import { useState, useEffect, useCallback } from 'react';

/**
 * useApi  –  Generic hook buat fetch data dari API.
 *
 * @param {Function} apiFn   - fungsi dari services/api.js
 * @param {Array}    deps    - dependency array (kayak useEffect)
 * @param {boolean}  lazy    - kalau true, tidak auto-fetch; panggil `execute()` manual
 *
 * @returns {{ data, loading, error, execute, reset }}
 */
export function useApi(apiFn, deps = [], { lazy = false } = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(!lazy);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      setData(result.data ?? result);
      return result;
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.');
      throw err;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!lazy) execute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lazy, ...deps]);

  const reset = () => { setData(null); setError(null); setLoading(false); };

  return { data, loading, error, execute, reset };
}

/**
 * useMutation  –  Untuk POST/PUT/DELETE yang trigger manual.
 *
 * @returns {{ execute, loading, error, data }}
 */
export function useMutation(apiFn) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      setData(result.data ?? result);
      return result;
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { execute, loading, error, data };
}
