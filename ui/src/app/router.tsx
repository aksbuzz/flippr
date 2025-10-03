import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppRoot, { ErrorBoundary } from './routes/root';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: '/',
      element: <AppRoot />,
      ErrorBoundary: ErrorBoundary,
      children: [
        {
          path: '/',
          lazy: () => import('./routes/home').then(convert(queryClient)),
        },
        {
          path: '/flags',
          lazy: () => import('./routes/flags').then(convert(queryClient)),
        },
        // {
        //   path: '/projects',
        //   lazy: () => import('./routes/projects').then(convert(queryClient)),
        // },
        // {
        //   path: '/environments',
        //   lazy: () => import('./routes/environments').then(convert(queryClient)),
        // },
      ],
    },
    {
      path: '*',
      lazy: () => import('./routes/not-found').then(convert(queryClient)),
    },
  ]);
;

export const AppRouter = () => {
  const queryClient = useQueryClient();
  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);

  return <RouterProvider router={router} />;
};
