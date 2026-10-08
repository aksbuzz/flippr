import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { getProjectsQueryOptions } from '../features/projects';
import { getToken, subscribeAuth } from '../lib/auth';
import AppRoot, { ErrorBoundary } from './routes/root';

const appRootLoader = (queryClient: QueryClient) => async () => {
  const query = getProjectsQueryOptions();
  // Never throw here: the sidebar shows its own error state with a Retry action, and a
  // throwing root loader would replace the whole layout.
  try {
    return queryClient.getQueryData(query.queryKey) ?? (await queryClient.fetchQuery(query));
  } catch {
    return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  };
};

// eslint-disable-next-line react-refresh/only-export-components
export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: '/',
      element: <AppRoot />,
      loader: appRootLoader(queryClient),
      ErrorBoundary: ErrorBoundary,
      children: [
        {
          // pathless wrapper: loader/render errors are shown inside the layout (Outlet)
          ErrorBoundary: ErrorBoundary,
          children: [
            {
              index: true,
              lazy: () => import('./routes/home').then(convert(queryClient)),
            },

            {
              path: '/projects/:projectId',
              children: [
                {
                  index: true,
                  element: <Navigate to="flags" replace />,
                },
                {
                  path: 'flags',
                  children: [
                    {
                      index: true,
                      lazy: () => import('./routes/flags').then(convert(queryClient)),
                    },
                    {
                      path: ':flagId',
                      lazy: () => import('./routes/flag').then(convert(queryClient)),
                    },
                  ],
                },
                {
                  path: 'environments',
                  lazy: () => import('./routes/environments').then(convert(queryClient)),
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: '*',
      lazy: () => import('./routes/not-found').then(convert(queryClient)),
    },
  ]);
export const AppRouter = () => {
  const queryClient = useQueryClient();
  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);

  // When the admin token changes (saved or cleared), re-run the route loaders.
  useEffect(() => {
    let last = getToken();
    return subscribeAuth(() => {
      const current = getToken();
      if (current !== last) {
        last = current;
        void router.revalidate();
      }
    });
  }, [router]);

  return <RouterProvider router={router} />;
};
