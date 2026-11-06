
'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  getCompanies,
} from '@/lib/api/companies';

import type {
  CompaniesListResponse,
} from '@/lib/api/companies';

import { ApiError } from '@/lib/api/client';

const INITIAL_RESULT: CompaniesListResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
};

export function useCompanies() {
  // Search
  const [searchInput, setSearchInputState] = useState('');
  const [search, setSearch] = useState('');

  // Level filters
  const [levels, setLevels] = useState<number[]>([]);

  // Pagination: frontend page is zero-based
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Data states
  const [result, setResult] =
    useState<CompaniesListResponse>(INITIAL_RESULT);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] =
    useState<number | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  const requestIdRef = useRef(0);

  // Search input with 350ms debounce
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchInput.trim();

      if (nextSearch !== search) {
        setLoading(true);
        setError('');
        setSearch(nextSearch);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput, search]);

  // Update search
  const updateSearch = useCallback((value: string) => {
    setSearchInputState(value);

    if (page !== 0) {
      setLoading(true);
      setError('');
      setPage(0);
    }
  }, [page]);

  // Update Level filter
  const updateLevels = useCallback(
    (value: number[]) => {
      const unchanged =
        value.length === levels.length &&
        value.every((level, index) => level === levels[index]);

      if (unchanged && page === 0) return;

      setLevels(value);
      setPage(0);
      setLoading(true);
      setError('');
    },
    [levels, page],
  );

  // Update pagination
  const updatePage = useCallback(
    (value: number) => {
      if (value === page) return;

      setPage(value);
      setLoading(true);
      setError('');
    },
    [page],
  );

  const updatePageSize = useCallback(
    (value: number) => {
      if (value === pageSize && page === 0) return;

      setPageSize(value);
      setPage(0);
      setLoading(true);
      setError('');
    },
    [pageSize, page],
  );

  // Refresh
  const refresh = useCallback(() => {
    setReloadKey((previous) => previous + 1);
    setLoading(true);
    setError('');
  }, []);

  // Fetch companies
  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestIdRef.current;

    const fetchCompanies = async () => {
      let hasPageCorrection = false;

      try {
        const response = await getCompanies({
          search: search || undefined,
          levels: levels.length ? levels : undefined,
          page: page + 1,
          pageSize,
        });

        if (
          cancelled ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setResult(response);
        setErrorStatus(null);

        // Correct page if current page exceeds the last page
        const lastPage = Math.max(
          0,
          response.totalPages - 1,
        );

        if (page > lastPage) {
          hasPageCorrection = true;
          setPage(lastPage);
        }
      } catch (err: unknown) {
        if (
          !cancelled &&
          requestId === requestIdRef.current
        ) {
          setErrorStatus(
            err instanceof ApiError ? err.status : null,
          );

          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load companies.',
          );
        }
      } finally {
        if (
          !cancelled &&
          requestId === requestIdRef.current &&
          !hasPageCorrection
        ) {
          setLoading(false);
        }
      }
    };

    void fetchCompanies();

    return () => {
      cancelled = true;
    };
  }, [
    search,
    levels,
    page,
    pageSize,
    reloadKey,
  ]);

  return {
    searchInput,
    levels,
    page,
    pageSize,

    companies: result.items,
    total: result.total,
    totalPages: result.totalPages,

    loading,
    error,
    errorStatus,

    updateSearch,
    updateLevels,
    updatePage,
    updatePageSize,
    refresh,
  };
}
