import { useState, useEffect } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = { immediate: true }
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: options.immediate ?? true,
    error: null,
  });

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.response?.data?.message || error.message || 'An error occurred'
      });
    }
  };

  useEffect(() => {
    if (options.immediate) {
      fetchData();
    }
  }, []);

  return {
    ...state,
    refetch: fetchData,
  };
}