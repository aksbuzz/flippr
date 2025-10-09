import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { FieldSet } from '../../../components/ui/FieldSet';
import { FormDialog } from '../../../components/ui/FormDialog';
import { SelectField } from '../../../components/ui/SelectField';
import { TextField } from '../../../components/ui/TextField';
import type { FlagType } from '../../../types';
import { createFlagSchema, useCreateFlag, type CreateFlagSchema } from '../api/create-flag';
import { TextareaField } from '../../../components/ui/TextareaField';

const defaultFormState: CreateFlagSchema = {
  name: '',
  key: '',
  flag_type: 'boolean',
  off_value: '',
};

const defaultFormErrors: Record<keyof CreateFlagSchema, string> = {
  name: '',
  key: '',
  flag_type: '',
  off_value: '',
};

export const CreateFlag = () => {
  const params = useParams();
  const projectId = params.projectId as string;

  const createFlagMutation = useCreateFlag();

  const [formState, setFormState] = useState<CreateFlagSchema>(defaultFormState);
  const [errors, setErrors] = useState<Record<keyof CreateFlagSchema, string>>(defaultFormErrors);

  async function handleSubmit() {
    const result = createFlagSchema.safeParse(formState);
    if (!result.success) {
      const formattedErrors = result.error.format();
      setErrors({
        name: formattedErrors.name?._errors?.[0] ?? '',
        key: formattedErrors.key?._errors?.[0] ?? '',
        flag_type: formattedErrors.flag_type?._errors?.[0] ?? '',
        off_value: formattedErrors.off_value?._errors?.[0] ?? '',
      });
      return;
    } else {
      setErrors(defaultFormErrors);
    }

    await createFlagMutation.mutateAsync({
      projectId,
      data: {
        name: formState.name,
        key: formState.key,
        flag_type: formState.flag_type,
        off_value: formState.off_value,
      },
    });

    setFormState(defaultFormState);
  }

  function handleFlagTypeChange(newType: FlagType) {
    let newOffValue = '';
    switch (newType) {
      case 'boolean':
        newOffValue = 'false';
        break;
      case 'string':
        newOffValue = '""';
        break;
      case 'number':
        newOffValue = '0';
        break;
      case 'json':
        newOffValue = '{}';
        break;
    }
    setFormState({ ...formState, flag_type: newType, off_value: newOffValue });
  }

  function renderOffValueField() {
    switch (formState.flag_type) {
      case 'boolean':
        return (
          <SelectField
            label="Off Value"
            name="off_value"
            value={formState.off_value}
            onChange={e => setFormState({ ...formState, off_value: e.target.value })}
            error={errors.off_value}
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </SelectField>
        );

      case 'number':
        return (
          <TextField
            label="Off Value"
            name="off_value"
            type="number"
            value={formState.off_value}
            onChange={e => setFormState({ ...formState, off_value: e.target.value })}
            error={errors.off_value}
            placeholder="0"
          />
        );

      case 'string':
        return (
          <TextField
            label="Off Value"
            name="off_value"
            type="text"
            value={formState.off_value}
            onChange={e => setFormState({ ...formState, off_value: e.target.value })}
            error={errors.off_value}
            placeholder="Enter string value"
          />
        );

      case 'json':
        return (
          <TextareaField
            label="Off Value"
            name="off_value"
            value={formState.off_value}
            onChange={e => setFormState({ ...formState, off_value: e.target.value })}
            error={errors.off_value}
            placeholder='{"key": "value"}'
            rows={4}
          />
        );
    }
  }

  return (
    <FormDialog
      title="Create new flag"
      triggerButton={<Button>Create Flag</Button>}
      onClose={() => {
        setFormState(defaultFormState);
        setErrors(defaultFormErrors);
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
          onChange={e =>
            setFormState({
              ...formState,
              name: e.target.value,
              key: e.target.value.toLowerCase().split(' ').join('-'),
            })
          }
          error={errors.name}
          placeholder="Eg. Enable dark mode"
        />
        <TextField
          label="Key"
          name="key"
          type="text"
          value={formState.key}
          onChange={e => setFormState({ ...formState, key: e.target.value })}
          error={errors.key}
          placeholder="Eg. dark_mode"
        />
        <SelectField
          label="Flag Type"
          name="flag_type"
          value={formState.flag_type}
          onChange={e => handleFlagTypeChange(e.target.value as FlagType)}
          error={errors.flag_type}
        >
          <option value="boolean">Boolean</option>
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="json">JSON</option>
        </SelectField>
        
        {renderOffValueField()}
      </FieldSet>
    </FormDialog>
  );
};
