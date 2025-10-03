import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { FormDialog } from '../../../components/ui/FormDialog';
import { type CreateFlagSchema, useCreateFlag } from '../api/create-flag';

export const CreateFlag = () => {
  const [data, setData] = useState<CreateFlagSchema>({ key: '', description: '' });

  const createFlagMutation = useCreateFlag();

  async function handleSubmit() {
    await createFlagMutation.mutateAsync({
      projectId: 1,
      data: {
        key: data.key,
        description: data.description,
      },
    });

    setData({ key: '', description: '' });
  }

  return (
    <FormDialog
      title="Create new flag"
      triggerButton={<Button>Create Flag</Button>}
      submitButton={
        <Button type="submit" onClick={handleSubmit} isLoading={createFlagMutation.isPending}>
          Submit
        </Button>
      }
      isDone={createFlagMutation.isSuccess}
    >
      {/* TODO: form */}
      Hello
    </FormDialog>
  );
};
