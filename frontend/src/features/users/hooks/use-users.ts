'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  getUsers,
} from '@/lib/api/users';

import type {
  UsersListResponse,
} from '@/lib/api/users';

import type {
  UserRole,
  UserStatus,
} from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

const INITIAL_RESULT: UsersListResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
};

export function useUsers(enabled = true) {
  // Search
  const [searchInput, setSearchInputState] = useState('');
  const [search, setSearch] = useState('');

  // Filters
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [statuses, setStatuses] = useState<UserStatus[]>([]);

  // Pagination: frontend page is zero-based
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Data states
  const [result, setResult] =
    useState<UsersListResponse>(INITIAL_RESULT);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  // Search input with 350ms debounce
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Update search
  const updateSearch = useCallback((value: string) => {
    setSearchInputState(value);
    setPage(0);
  }, []);

  // Update Role filter
  const updateRoles = useCallback((value: UserRole[]) => {
    setRoles(value);
    setPage(0);
  }, []);

  // Update Status filter
  const updateStatuses = useCallback(
    (value: UserStatus[]) => {
      setStatuses(value);
      setPage(0);
    },
    [],
  );

  // Update pagination
  const updatePage = useCallback((value: number) => {
    setPage(value);
  }, []);

  const updatePageSize = useCallback((value: number) => {
    setPageSize(value);
    setPage(0);
  }, []);

  // Refresh
  const refresh = useCallback(() => {
    setReloadKey((previous) => previous + 1);
  }, []);

  // Fetch users
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const fetchUsers = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getUsers({
          search: search || undefined,
          roles: roles.length ? roles : undefined,
          statuses: statuses.length
            ? statuses
            : undefined,
          page: page + 1,
          pageSize,
        });

        if (!cancelled) {
          setResult(response);
          setErrorStatus(null);
          // Role/status changes can remove the final row from a filtered page.
          const lastPage = Math.max(0, response.totalPages - 1);
          if (page > lastPage) setPage(lastPage);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setErrorStatus(error instanceof ApiError ? error.status : null);
          setError(
            error instanceof Error
              ? error.message
              : 'Failed to load users.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    search,
    roles,
    statuses,
    page,
    pageSize,
    reloadKey,
  ]);

  return {
    searchInput,
    roles,
    statuses,
    page,
    pageSize,

    users: enabled ? result.items : [],
    total: enabled ? result.total : 0,
    totalPages: enabled ? result.totalPages : 0,

    loading: enabled && loading,
    error: enabled ? error : '',
    errorStatus: enabled ? errorStatus : null,

    updateSearch,
    updateRoles,
    updateStatuses,
    updatePage,
    updatePageSize,
    refresh,
  };
}
