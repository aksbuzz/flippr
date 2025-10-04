import { BasicDialog } from '../../../components/ui/Dialog';
import { FieldSet } from '../../../components/ui/FieldSet';
import { SwitchField } from '../../../components/ui/SwitcField';
import type { FeatureFlags } from '../../../types/api';
import { useUpdateFlagState, type UpdateFlagSchema } from '../api/update-flag-state';

export type UpdateFlagStateProps = {
  isOpen: boolean;
  onClose: () => void;
  data: {
    project_id: string;
    name: string;
    key: string;
    environments: FeatureFlags['environments'];
  };
};

export const UpdateFlagState = ({
  isOpen,
  onClose,
  data: { project_id, name, key, environments },
}: UpdateFlagStateProps) => {
  const updateFlagStateMutation = useUpdateFlagState();

  async function handleSubmit(environmentId: string, data: UpdateFlagSchema) {
    updateFlagStateMutation.mutate({ projectId: project_id, environmentId, flagKey: key, data });
  }

  return (
    <BasicDialog isOpen={isOpen} onClose={onClose} title={`Update ${name}`} withClose>
      <FieldSet>
        {environments.length === 0 && (
          <p className="text-sm text-muted-foreground">No environments found</p>
        )}

        {environments.map(e => (
          <SwitchField
            key={e.id}
            label={e.name}
            checked={e.is_enabled}
            onChange={enabled => handleSubmit(e.id, { is_enabled: enabled })}
            name={e.id + e.name}
          />
        ))}
      </FieldSet>
    </BasicDialog>
  );
};
