import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes before background refresh
      staleTime: 5 * 60 * 1000,
      // Keep unused data for 10 minutes before garbage collecting
      gcTime: 10 * 60 * 1000,
      // Retry failed requests twice before surfacing an error
      retry: 2,
      // Don't retry on 401/403 (auth errors should surface immediately)
      retryOnMount: false,
      // Refetch when window regains focus (keeps data fresh)
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});
