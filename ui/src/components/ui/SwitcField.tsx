import { Description, Field, Label, Switch } from '@headlessui/react';
import { cn } from '../../utils/cn';

export interface SwitchFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
}

export const SwitchField = ({ label, description, checked, onChange, name }: SwitchFieldProps) => {
  return (
    <Field as="div" className="flex items-center justify-between">
      <span className="flex flex-grow flex-col">
        <Label as="span" className="text-sm font-medium text-slate-900" passive>
          {label}
        </Label>
        {description && (
          <Description as="span" className="text-sm text-slate-500">
            {description}
          </Description>
        )}
      </span>
      <Switch
        checked={checked}
        onChange={onChange}
        name={name}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
          { 'bg-purple-600': checked, 'bg-slate-200': !checked }
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            { 'translate-x-5': checked, 'translate-x-0': !checked }
          )}
        />
      </Switch>
    </Field>
  );
};
