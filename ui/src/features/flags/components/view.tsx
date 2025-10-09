import type { FeatureFlag } from '../../../types/api';

type ViewFlagProps = {
  flag: FeatureFlag;
};

export const ViewFlag = ({ flag }: ViewFlagProps) => {
  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex">
          <div className="basis-1/2 text-dark text-sm space-y-1">
            <h3 className="text-sm font-semibold">Name</h3>
            <p>{flag.name}</p>
          </div>
          <div className="basis-1/2 text-dark text-sm space-y-1">
            <h3 className="text-sm font-semibold">Key</h3>
            <p>{flag.key}</p>
          </div>
        </div>
        <div className="flex">
          <div className="basis-1/2 text-dark text-sm space-y-1">
            <h3 className="text-sm font-semibold">Type</h3>
            <p>{flag.flag_type}</p>
          </div>
          <div className="basis-1/2 text-dark text-sm space-y-1">
            <h3 className="text-sm font-semibold">Off Value</h3>
            <pre>{JSON.stringify(flag.off_value, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
