import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Repository } from '../types/auth';
import { fetchConnectedRepositories } from '../services/api';

interface RepositoryContextType {
  repositories: Repository[];
  selectedRepoId: string | null;
  selectedRepo: Repository | null;
  selectedBranch: string;
  loading: boolean;
  error: string | null;
  setSelectedRepoId: (id: string) => void;
  refreshRepositories: () => Promise<void>;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

const STORAGE_KEY = 'devintel_selected_repo_id';

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRepositories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchConnectedRepositories();
      const repos = res.data || [];
      setRepositories(repos);

      setSelectedRepoIdState((currentId) => {
        if (currentId && repos.some((r) => r.id === currentId)) {
          return currentId;
        }
        if (repos.length > 0) {
          const defaultId = repos[0].id;
          localStorage.setItem(STORAGE_KEY, defaultId);
          return defaultId;
        }
        localStorage.removeItem(STORAGE_KEY);
        return null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRepositories();
  }, [loadRepositories]);

  const setSelectedRepoId = (id: string) => {
    setSelectedRepoIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const selectedRepo = repositories.find((r) => r.id === selectedRepoId) || null;
  const selectedBranch = selectedRepo?.defaultBranch || 'main';

  return (
    <RepositoryContext.Provider
      value={{
        repositories,
        selectedRepoId,
        selectedRepo,
        selectedBranch,
        loading,
        error,
        setSelectedRepoId,
        refreshRepositories: loadRepositories,
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
};

export function useRepository(): RepositoryContextType {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
}
