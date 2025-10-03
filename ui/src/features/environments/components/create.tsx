import { useState } from 'react';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { FieldSet } from '../../../components/ui/FieldSet';
import { FormDialog } from '../../../components/ui/FormDialog';
import { TextField } from '../../../components/ui/TextField';
import {
  createEnvironmentSchema,
  useCreateEnvironment,
  type CreateEnvironmentSchema,
} from '../api/create-environments';

export const CreateEnvironment = () => {
  const createEnvironmentMutation = useCreateEnvironment();

  const [formState, setFormState] = useState<CreateEnvironmentSchema>({ name: '' });
  const [errors, setErrors] = useState<CreateEnvironmentSchema>({ name: '' });

  async function handleSubmit() {
    const result = createEnvironmentSchema.safeParse(formState);
    if (!result.success) {
      const treeified = z.treeifyError(result.error);
      setErrors({ name: treeified.properties?.name?.errors?.[0] ?? '' });
      return;
    } else {
      setErrors({ name: '' });
    }

    await createEnvironmentMutation.mutateAsync({ projectId: 1, data: { name: formState.name } });

    setFormState({ name: '' });
  }

  return (
    <FormDialog
      title="Create new environment"
      triggerButton={<Button>Create Environment</Button>}
      onClose={() => {
        setFormState({ name: '' });
        setErrors({ name: '' });
      }}
      submitButton={
        <Button
          type="submit"
          onClick={handleSubmit}
          isLoading={createEnvironmentMutation.isPending}
        >
          Submit
        </Button>
      }
      isDone={createEnvironmentMutation.isSuccess}
    >
      <FieldSet>
        <TextField
          label="Name"
          name="name"
          type="text"
          value={formState.name}
          onChange={e => setFormState({ ...formState, name: e.target.value })}
          error={errors.name}
          hint='Eg. "Dev", "Staging", "Production"'
        />
      </FieldSet>
    </FormDialog>
  );
};
