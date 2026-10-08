import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '../../../lib/api-client';
import type { MutationConfig } from '../../../lib/react-query';
import type { Environment } from '../../../types/api';

export const createEnvironmentSchema = z.object({
  name: z
    .string()
    .min(1, 'Environment name is required')
    .max(50, 'Environment name must be at most 50 characters')
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9 ._-]*$/,
      'Use letters, numbers, spaces, ".", "_" or "-", starting with a letter or number'
    ),
});

export type CreateEnvironmentSchema = z.infer<typeof createEnvironmentSchema>;

export const createEnvironment = ({
  projectId,
  data,
}: {
  projectId: string;
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
    onSuccess: (data, variables, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: ['environments', { projectId: variables.projectId }],
      });
      // flag lists and flag details embed per-environment state
      queryClient.invalidateQueries({ queryKey: ['flags'] });
      queryClient.invalidateQueries({ queryKey: ['flag'] });
      onSuccess?.(data, variables, ...rest);
    },
    ...restConfig,
    mutationFn: createEnvironment,
  });
};
