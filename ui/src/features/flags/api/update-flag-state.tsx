import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '../../../lib/api-client';
import type { MutationConfig } from '../../../lib/react-query';
import type { EnvironmentFlagState, FeatureFlags } from '../../../types/api';
import { getFlagsQueryOptions } from './get-flags';

export const updateFlagSchema = z.object({
  is_enabled: z.boolean(),
});

export type UpdateFlagSchema = z.infer<typeof updateFlagSchema>;

type UpdateFlagStateParams = {
  projectId: string;
  environmentId: string;
  flagKey: string;
  data: UpdateFlagSchema;
};

export const updateFlagState = ({
  environmentId,
  flagKey,
  data,
}: Omit<UpdateFlagStateParams, 'projectId'>): Promise<{ data: EnvironmentFlagState }> => {
  return api.patch(`/environments/${environmentId}/flags/${flagKey}`, data);
};

type UseMutationConfig = {
  mutationConfig?: MutationConfig<typeof updateFlagState>;
};

export const useUpdateFlagState = ({ mutationConfig }: UseMutationConfig = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...mutationConfig,
    mutationFn: updateFlagState,
    onMutate: async (newData: UpdateFlagStateParams) => {
      const { projectId, flagKey, environmentId, data } = newData;
      const queryKey = getFlagsQueryOptions(projectId).queryKey;

      await queryClient.cancelQueries({ queryKey });
      const previousFlagsData = queryClient.getQueryData<{ data: FeatureFlags[] }>(queryKey);

      if (previousFlagsData) {
        queryClient.setQueryData<{ data: FeatureFlags[] }>(queryKey, {
          ...previousFlagsData,
          data: previousFlagsData.data.map(flag =>
            flag.key === flagKey
              ? {
                  ...flag,
                  environments: flag.environments.map(env =>
                    env.id === environmentId ? { ...env, is_enabled: data.is_enabled } : env
                  ),
                }
              : flag
          ),
        });
      }

      return { previousFlagsData };
    },
    onError: (_, newData, context) => {
      const { projectId } = newData;
      const queryKey = getFlagsQueryOptions(projectId).queryKey;
      if (context?.previousFlagsData) {
        queryClient.setQueryData(queryKey, context.previousFlagsData);
      }
    },
    onSettled: (_, _2, newData) => {
      const { projectId } = newData;
      const queryKey = getFlagsQueryOptions(projectId).queryKey;
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
