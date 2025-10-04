import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { FieldSet } from '../../../components/ui/FieldSet';
import { FormDialog } from '../../../components/ui/FormDialog';
import { TextField } from '../../../components/ui/TextField';
import { createFlagSchema, useCreateFlag, type CreateFlagSchema } from '../api/create-flag';

export const CreateFlag = () => {
  const params = useParams();
  const projectId = params.projectId as string;

  const createFlagMutation = useCreateFlag();

  const [formState, setFormState] = useState<CreateFlagSchema>({
    name: '',
    key: '',
    description: '',
  });
  const [errors, setErrors] = useState<CreateFlagSchema>({ name: '', key: '', description: '' });

  async function handleSubmit() {
    const result = createFlagSchema.safeParse(formState);
    if (!result.success) {
      const treeified = z.treeifyError(result.error);
      setErrors({
        name: treeified.properties?.name?.errors?.[0] ?? '',
        key: treeified.properties?.key?.errors?.[0] ?? '',
        description: treeified.properties?.description?.errors?.[0] ?? '',
      });
      return;
    } else {
      setErrors({ name: '', key: '', description: '' });
    }

    await createFlagMutation.mutateAsync({
      projectId,
      data: { name: formState.name, key: formState.key, description: formState.description },
    });

    setFormState({ name: '', key: '', description: '' });
  }

  return (
    <FormDialog
      title="Create new flag"
      triggerButton={<Button>Create Flag</Button>}
      onClose={() => {
        setFormState({ name: '', key: '', description: '' });
        setErrors({ name: '', key: '', description: '' });
      }}
      submitButton={
        <Button type="submit" onClick={handleSubmit} isLoading={createFlagMutation.isPending}>
          Submit
        </Button>
      }
      isDone={createFlagMutation.isSuccess}
    >
      <FieldSet>
        <TextField
          label="Name"
          name="name"
          type="text"
          value={formState.name}
          onChange={e => setFormState({ ...formState, name: e.target.value })}
          error={errors.name}
          placeholder="Eg. Enable dark mode"
          // hint="Redable name of the flag"
        />
        <TextField
          label="Key"
          name="key"
          type="text"
          value={formState.key}
          onChange={e => setFormState({ ...formState, key: e.target.value })}
          error={errors.key}
          placeholder="Eg. dark_mode"
          // hint="Unique key for the flag"
        />
        <TextField
          label="Description"
          name="description"
          type="text"
          value={formState.description}
          onChange={e => setFormState({ ...formState, description: e.target.value })}
          error={errors.description}
          placeholder="Eg. Enable dark mode"
          // hint="Description of the flag"
        />
      </FieldSet>
    </FormDialog>
  );
};
