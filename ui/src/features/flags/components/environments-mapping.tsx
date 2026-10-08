import { useState } from 'react';
import { DataTable } from '../../../components/ui/DataTable';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorMessage } from '../../../components/ui/ErrorPanel';
import { SelectField } from '../../../components/ui/SelectField';
import { SwitchField } from '../../../components/ui/SwitcField';
import type { FeatureFlagResponse } from '../../../types/api';
import { useUpdateFlagState } from '../api/update-flag-state';

type ListEnvironmentMappingProps = {
  flag: FeatureFlagResponse;
};

export const ListEnvironmentMapping = ({ flag }: ListEnvironmentMappingProps) => {
  const updateFlagStateMutation = useUpdateFlagState({ projectId: flag.project_id });
  // variants picked on environments where the flag is disabled; applied by the enable switch
  const [pendingSelection, setPendingSelection] = useState<Record<string, string>>({});

  const pendingEnvironmentId = updateFlagStateMutation.isPending
    ? updateFlagStateMutation.variables?.environmentId
    : undefined;

  function clearSelection(environmentId: string) {
    setPendingSelection(prev => {
      const next = { ...prev };
      delete next[environmentId];
      return next;
    });
  }

  function handleIsEnabledChange(
    environmentId: string,
    is_enabled: boolean,
    serving_variant_id: string
  ) {
    updateFlagStateMutation.mutate(
      {
        flagId: flag.id,
        environmentId: environmentId,
        data: { is_enabled, serving_variant_id },
      },
      { onSuccess: () => clearSelection(environmentId) }
    );
  }

  function handleServingVariantChange(
    environmentId: string,
    isEnabled: boolean,
    serving_variant_id: string
  ) {
    if (!isEnabled) {
      // only change the local selection; the enable switch applies it
      setPendingSelection(prev => ({ ...prev, [environmentId]: serving_variant_id }));
      return;
    }
    updateFlagStateMutation.mutate({
      flagId: flag.id,
      environmentId: environmentId,
      data: { is_enabled: true, serving_variant_id },
    });
  }

  if (flag.environments.length === 0) {
    return (
      <div className="py-2">
        <EmptyState
          title="No environments yet"
          description="Create an environment in this project to control this flag per environment."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <ErrorMessage
        error={updateFlagStateMutation.error}
        onDismiss={() => updateFlagStateMutation.reset()}
        className="mb-3"
      />
      <DataTable
        columns={[
          {
            title: 'NAME',
            field: 'name',
            Cell: ({ entry: { name } }) => <span className="font-semibold">{name}</span>,
          },
          {
            title: 'SERVING VARIANT',
            field: 'serving_variant_key',
            Cell: ({ entry: { id, is_enabled, serving_variant_id } }) => (
              <SelectField
                name="serving_variant_id"
                value={pendingSelection[id] ?? serving_variant_id ?? ''}
                onChange={e => handleServingVariantChange(id, is_enabled, e.target.value)}
                disabled={pendingEnvironmentId === id}
              >
                <option value="" disabled>
                  Select variant
                </option>
                {flag.variants.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.key}
                  </option>
                ))}
              </SelectField>
            ),
          },
          {
            title: 'ENABLED',
            field: 'is_enabled',
            align: 'center',
            Cell: ({ entry: { is_enabled, id, serving_variant_id } }) => {
              const effectiveVariantId = pendingSelection[id] ?? serving_variant_id;
              return (
                <SwitchField
                  checked={is_enabled}
                  className="justify-center"
                  name="is_enabled"
                  disabled={!effectiveVariantId || pendingEnvironmentId === id}
                  onChange={e => handleIsEnabledChange(id, e, effectiveVariantId)}
                />
              );
            },
          },
        ]}
        data={flag.environments}
      />
    </div>
  );
};
