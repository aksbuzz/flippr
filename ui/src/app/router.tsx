import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { getProjectsQueryOptions } from '../features/projects';
import AppRoot, { ErrorBoundary } from './routes/root';

const appRootLoader = (queryClient: QueryClient) => async () => {
  const query = getProjectsQueryOptions();
  return queryClient.getQueryData(query.queryKey) ?? (await queryClient.fetchQuery(query));
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
                }
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
    {
      path: '*',
      lazy: () => import('./routes/not-found').then(convert(queryClient)),
    },
  ]);
export const AppRouter = () => {
  const queryClient = useQueryClient();
  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);

  return <RouterProvider router={router} />;
};
