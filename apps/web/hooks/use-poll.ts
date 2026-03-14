"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UsePollResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

/**
 * Poll a fetcher function at a given interval while enabled.
 * Stops polling when enabled becomes false or component unmounts.
 */
export function usePoll<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  enabled: boolean
): UsePollResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const poll = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // immediate first poll
    poll();

    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, poll]);

  return { data, error, loading };
}
