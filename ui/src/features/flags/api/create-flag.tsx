import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MutationConfig } from '../../../lib/react-query';
import { getFlagsQueryOptions } from './get-flags';
import { z } from 'zod';
import { api } from '../../../lib/api-client';
import type { FeatureFlag } from '../../../types/api';

export const createFlagSchema = z.object({
  key: z.string().min(1, 'Flag key is required'),
  description: z.string().optional().default(''),
});

export type CreateFlagSchema = z.infer<typeof createFlagSchema>;

export const createFlag = ({
  projectId,
  data,
}: {
  projectId: number;
  data: CreateFlagSchema;
}): Promise<{ data: FeatureFlag }> => {
  return api.post(`/projects/${projectId}/flags`, data);
};

type UseMutationConfig = {
  mutationConfig?: MutationConfig<typeof createFlag>;
};

export const useCreateFlag = ({ mutationConfig }: UseMutationConfig = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, ...args) => {
      queryClient.refetchQueries({
        queryKey: getFlagsQueryOptions(data.data.project_id).queryKey,
      });
      onSuccess?.(data, ...args);
    },
    ...restConfig,
    mutationFn: createFlag,
  });
};
