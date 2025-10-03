import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';
import { Suspense, useState } from 'react';
import { Spinner } from '../components/ui/Spinner';
import { ErrorBoundary } from 'react-error-boundary';
import { GlobalErrorFallback } from '../components/errors/main';

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
            staleTime: 1000 * 60,
          },
        },
      })
  );

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center">
          <Spinner size="xl" />
        </div>
      }
    >
      <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
        <QueryClientProvider client={queryClient}>
          {/* Notifications */}
          {children}
        </QueryClientProvider>
      </ErrorBoundary>
    </Suspense>
  );
};
