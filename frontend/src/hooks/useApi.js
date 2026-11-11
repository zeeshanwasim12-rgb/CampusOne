import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errMessage } from '../services/api';

/**
 * useApi — declarative GET with loading/error/data + refetch.
 * Usage: const { data, loading, error, refetch } = useApi('/resources', { params });
 * Pass `enabled: false` to defer the call (e.g. until a filter is chosen).
 */
export function useApi(url, { params, enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const [pagination, setPagination] = useState(null);
  // Serialize params so the effect only re-runs when they actually change.
  const key = JSON.stringify(params || {});
  const savedUrl = useRef(url);
  savedUrl.current = url;

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api.get(savedUrl.current, { params });
      setState({ data: res.data.data, loading: false, error: null });
      setPagination(res.data.pagination || null);
      return res.data;
    } catch (e) {
      setState({ data: null, loading: false, error: errMessage(e) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (enabled) run();
  }, [run, enabled]);

  return { ...state, pagination, refetch: run, setData: (data) => setState((s) => ({ ...s, data })) };
}

export default useApi;
