import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MutationConfig } from '../../../lib/react-query';
import { z } from 'zod';
import { api } from '../../../lib/api-client';
import type { Project } from '../../../types/api';

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be at most 100 characters'),
});

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;

export const createProject = ({ data }: { data: CreateProjectSchema }): Promise<{ data: Project }> => {
  return api.post(`/projects`, data);
};

type UseMutationConfig = {
  mutationConfig?: MutationConfig<typeof createProject>;
};

export const useCreateProject = ({ mutationConfig }: UseMutationConfig = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: createProject,
  });
};
