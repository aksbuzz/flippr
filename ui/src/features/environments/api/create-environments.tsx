import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '../../../lib/api-client';
import type { MutationConfig } from '../../../lib/react-query';
import type { Environment } from '../../../types/api';
import { getEnvironmentsQueryOptions } from './get-environments';

export const createEnvironmentSchema = z.object({
  name: z.string().min(1, 'Environment name is required'),
});

export type CreateEnvironmentSchema = z.infer<typeof createEnvironmentSchema>;

export const createEnvironment = ({
  projectId,
  data,
}: {
  projectId: number;
  data: CreateEnvironmentSchema;
}): Promise<{ data: Environment }> => {
  return api.post(`/projects/${projectId}/environments`, data);
};

type UseMutationConfig = {
  mutationConfig?: MutationConfig<typeof createEnvironment>;
};

export const useCreateEnvironment = ({ mutationConfig }: UseMutationConfig = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, ...args) => {
      queryClient.refetchQueries({
        queryKey: getEnvironmentsQueryOptions(data.data?.id).queryKey,
      });
      onSuccess?.(data, ...args);
    },
    ...restConfig,
    mutationFn: createEnvironment,
  });
};
