import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MutationConfig } from '../../../lib/react-query';
import { getFlagsQueryOptions } from './get-flags';
import { z } from 'zod';
import { api } from '../../../lib/api-client';
import type { FeatureFlag } from '../../../types/api';

export const createFlagSchema = z
  .object({
    name: z.string().min(1, 'Flag name is required'),
    key: z.string().min(1, 'Flag key is required'),
    flag_type: z.enum(['boolean', 'string', 'number', 'json']).default('boolean'),
    off_value: z.string().min(1, 'Off value is required'),
  })
  .superRefine((data, ctx) => {
    switch (data.flag_type) {
      case 'boolean':
        if (data.off_value !== 'true' && data.off_value !== 'false') {
          ctx.addIssue({
            code: 'custom',
            message: 'Off value must be true or false',
            path: ['off_value'],
          });
        }
        break;

      case 'number':
        if (isNaN(Number(data.off_value)) || data.off_value.trim() === '') {
          ctx.addIssue({
            code: 'custom',
            message: 'Off value must be a valid number',
            path: ['off_value'],
          });
        }
        break;

      case 'string':
        break;

      case 'json':
        try {
          const parsed = JSON.parse(data.off_value);
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            ctx.addIssue({
              code: 'custom',
              message: 'Off value must be a valid JSON object',
              path: ['off_value'],
            });
          }
        } catch {
          ctx.addIssue({
            code: 'custom',
            message: 'Off value must be valid JSON',
            path: ['off_value'],
          });
        }
        break;
    }
  });

export type CreateFlagSchema = z.infer<typeof createFlagSchema>;

export const createFlag = ({
  projectId,
  data,
}: {
  projectId: string;
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
