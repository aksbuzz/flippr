import { DataTable } from '../../../components/ui/DataTable';
import { SelectField } from '../../../components/ui/SelectField';
import { SwitchField } from '../../../components/ui/SwitcField';
import type { FeatureFlagResponse } from '../../../types/api';
import { useUpdateFlagState } from '../api/update-flag-state';

type ListEnvironmentMappingProps = {
  flag: FeatureFlagResponse;
};

export const ListEnvironmentMapping = ({ flag }: ListEnvironmentMappingProps) => {
  const updateFlagStateMutation = useUpdateFlagState({ projectId: flag.project_id });

  async function handleIsEnabledChange(
    environmentId: string,
    is_enabled: boolean,
    serving_variant_id: string
  ) {
    updateFlagStateMutation.mutate({
      flagId: flag.id,
      environmentId: environmentId,
      data: { is_enabled, serving_variant_id },
    });
  }

  function handleServingVariantChange(environmentId: string, serving_variant_id: string) {
    updateFlagStateMutation.mutate({
      flagId: flag.id,
      environmentId: environmentId,
      data: { is_enabled: true, serving_variant_id },
    });
  }

  return (
    <div className="container mx-auto py-2">
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
                value={serving_variant_id ?? ''}
                onChange={e => handleServingVariantChange(id, e.target.value)}
                disabled={!!serving_variant_id && !is_enabled}
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
            Cell: ({ entry: { is_enabled, id, serving_variant_id } }) => (
              <SwitchField
                checked={is_enabled}
                className='justify-center'
                name="is_enabled"
                disabled={!serving_variant_id}
                onChange={e => handleIsEnabledChange(id, e, serving_variant_id)}
              />
            ),
          },
        ]}
        data={flag.environments}
      />
    </div>
  );
};
