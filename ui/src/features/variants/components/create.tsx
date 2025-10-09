import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { FieldSet } from '../../../components/ui/FieldSet';
import { FormDialog } from '../../../components/ui/FormDialog';
import { SelectField } from '../../../components/ui/SelectField';
import { TextareaField } from '../../../components/ui/TextareaField';
import { TextField } from '../../../components/ui/TextField';
import type { FlagType } from '../../../types';
import {
  createVariantSchema,
  useCreateVariant,
  type CreateVariantSchema,
} from '../api/create-variant';

const defaultFormState: CreateVariantSchema = {
  key: '',
  value: '',
};

const defaultFormErrors: Record<keyof CreateVariantSchema, string> = {
  key: '',
  value: '',
};

export const CreateVariant = ({ flagId, flagType }: { flagId: string; flagType: FlagType }) => {
  const createVariantMutation = useCreateVariant();

  const [formState, setFormState] = useState<CreateVariantSchema>(defaultFormState);
  const [errors, setErrors] =
    useState<Record<keyof CreateVariantSchema, string>>(defaultFormErrors);

  async function handleSubmit() {
    const result = createVariantSchema(flagType).safeParse(formState);
    if (!result.success) {
      const formattedErrors = result.error.format();
      setErrors({
        key: formattedErrors.key?._errors?.[0] ?? '',
        value: formattedErrors.value?._errors?.[0] ?? '',
      });
      return;
    } else {
      setErrors(defaultFormErrors);
    }

    await createVariantMutation.mutateAsync({ flagId, data: formState });

    setFormState(defaultFormState);
  }

  function renderValueField() {
    switch (flagType) {
      case 'boolean':
        return (
          <SelectField
            label="Value"
            name="value"
            value={formState.value}
            onChange={e => setFormState({ ...formState, value: e.target.value })}
            error={errors.value}
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </SelectField>
        );

      case 'number':
        return (
          <TextField
            label="Value"
            name="value"
            type="number"
            value={formState.value}
            onChange={e => setFormState({ ...formState, value: e.target.value })}
            error={errors.value}
            placeholder="0"
          />
        );

      case 'string':
        return (
          <TextField
            label="Value"
            name="value"
            type="text"
            value={formState.value}
            onChange={e => setFormState({ ...formState, value: e.target.value })}
            error={errors.value}
            placeholder="Enter string value"
          />
        );

      case 'json':
        return (
          <TextareaField
            label="Value"
            name="value"
            value={formState.value}
            onChange={e => setFormState({ ...formState, value: e.target.value })}
            error={errors.value}
            placeholder='{"key": "value"}'
            rows={4}
          />
        );
    }
  }

  return (
    <FormDialog
      title="Create new variant"
      triggerButton={<Button>Create Variant</Button>}
      onClose={() => {
        setFormState(defaultFormState);
        setErrors(defaultFormErrors);
      }}
      submitButton={
        <Button type="submit" onClick={handleSubmit} isLoading={createVariantMutation.isPending}>
          Submit
        </Button>
      }
      isDone={createVariantMutation.isSuccess}
    >
      <FieldSet>
        <TextField
          label="Name"
          name="key"
          type="text"
          value={formState.key}
          onChange={e => setFormState({ ...formState, key: e.target.value })}
          error={errors.key}
          placeholder="Eg. Red"
        />

        {renderValueField()}
      </FieldSet>
    </FormDialog>
  );
};
