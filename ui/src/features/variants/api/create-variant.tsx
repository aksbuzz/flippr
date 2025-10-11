import { useMutation, useQueryClient } from '@tanstack/react-query';
import z from 'zod';
import { api } from '../../../lib/api-client';
import type { MutationConfig } from '../../../lib/react-query';
import type { FlagType } from '../../../types';
import type { FlagVariant } from '../../../types/api';
import { getVariantsQueryOptions } from './get-variants';
import { getFlagQueryOptions } from '../../flags';
import { useParams } from 'react-router-dom';

export const createVariantSchema = (flagType: FlagType) =>
  z
    .object({
      key: z.string().min(1, 'Variant key is required'),
      value: z.string().min(1, 'Value is required'),
    })
    .superRefine((data, ctx) => {
      switch (flagType) {
        case 'boolean':
          if (data.value !== 'true' && data.value !== 'false') {
            ctx.addIssue({
              code: 'custom',
              message: 'Value must be true or false',
              path: ['value'],
            });
          }
          break;

        case 'number':
          if (isNaN(Number(data.value)) || data.value.trim() === '') {
            ctx.addIssue({
              code: 'custom',
              message: 'Value must be a valid number',
              path: ['value'],
            });
          }
          break;

        case 'string':
          break;

        case 'json':
          try {
            const parsed = JSON.parse(data.value);
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
              ctx.addIssue({
                code: 'custom',
                message: 'Value must be a valid JSON object',
                path: ['value'],
              });
            }
          } catch {
            ctx.addIssue({
              code: 'custom',
              message: 'Value must be valid JSON',
              path: ['value'],
            });
          }
          break;
      }
    });

export type CreateVariantSchema = z.infer<ReturnType<typeof createVariantSchema>>;

export const createVariant = ({
  flagId,
  data,
}: {
  flagId: string;
  data: CreateVariantSchema;
}): Promise<{ data: FlagVariant }> => {
  return api.post(`/flags/${flagId}/variants`, data);
};

type UseMutationConfig = {
  mutationConfig?: MutationConfig<typeof createVariant>;
};

export const useCreateVariant = ({ mutationConfig }: UseMutationConfig = {}) => {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, ...args) => {
      queryClient.refetchQueries({
        queryKey: getVariantsQueryOptions(data.data.feature_flag_id).queryKey,
      });
      queryClient.refetchQueries({
        queryKey: getFlagQueryOptions(projectId, args[0].flagId).queryKey,
      });
      onSuccess?.(data, ...args);
    },
    ...restConfig,
    mutationFn: createVariant,
  });
};
