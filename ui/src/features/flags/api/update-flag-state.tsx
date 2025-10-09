import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '../../../lib/api-client';
import type { MutationConfig } from '../../../lib/react-query';
import type { EnvironmentFlagStateResponse } from '../../../types/api';
import { getFlagQueryOptions } from './get-flag';

export const updateFlagStateSchema = z.discriminatedUnion('is_enabled', [
  z.object({
    is_enabled: z.literal(true),
    serving_variant_id: z.string().uuid('Must be a valid variant UUID'),
  }),
  z.object({ is_enabled: z.literal(false) }),
]);

export type UpdateFlagStateSchema = z.infer<typeof updateFlagStateSchema>;

type UpdateFlagStateParams = {
  environmentId: string;
  flagId: string;
  data: UpdateFlagStateSchema;
};

export const updateFlagState = ({
  environmentId,
  flagId,
  data,
}: UpdateFlagStateParams): Promise<{ data: EnvironmentFlagStateResponse }> => {
  return api.patch(`/flags/${flagId}/environments/${environmentId}`, data);
};

type UseMutationConfig = {
  projectId: string;
  mutationConfig?: MutationConfig<typeof updateFlagState>;
};

export const useUpdateFlagState = ({ mutationConfig, projectId }: UseMutationConfig) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess(data, ...args) {
      queryClient.refetchQueries({
        queryKey: getFlagQueryOptions(projectId, data.data.flag_id).queryKey,
      });
      onSuccess?.(data, ...args);
    },
    ...restConfig,
    mutationFn: updateFlagState,
  });
};
