import { useState } from 'react';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { FieldSet } from '../../../components/ui/FieldSet';
import { FormDialog } from '../../../components/ui/FormDialog';
import { TextField } from '../../../components/ui/TextField';
import {
  createProjectSchema,
  useCreateProject,
  type CreateProjectSchema,
} from '../api/create-project';

export const CreateProject = () => {
  const createProjectMutation = useCreateProject();

  const [formState, setFormState] = useState<CreateProjectSchema>({ name: '' });
  const [errors, setErrors] = useState<CreateProjectSchema>({ name: '' });

  async function handleSubmit() {
    const result = createProjectSchema.safeParse(formState);
    if (!result.success) {
      const treeified = z.treeifyError(result.error);
      setErrors({ name: treeified.properties?.name?.errors?.[0] ?? '' });
      return;
    } else {
      setErrors({ name: '' });
    }

    await createProjectMutation.mutateAsync({ data: { name: formState.name } });

    setFormState({ name: '' });
  }

  return (
    <FormDialog
      title="Create new project"
      triggerButton={<Button>Create Project</Button>}
      onClose={() => {
        setFormState({ name: '' });
        setErrors({ name: '' });
      }}
      submitButton={
        <Button type="submit" onClick={handleSubmit} isLoading={createProjectMutation.isPending}>
          Submit
        </Button>
      }
      isDone={createProjectMutation.isSuccess}
    >
      <FieldSet>
        <TextField
          label="Name"
          name="name"
          type="text"
          value={formState.name}
          onChange={e => setFormState({ ...formState, name: e.target.value })}
          error={errors.name}
          placeholder="Eg. My Project"
        />
      </FieldSet>
    </FormDialog>
  );
};
