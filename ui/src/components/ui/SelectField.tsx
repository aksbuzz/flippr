import { Description, Field, Label, Select } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, hint, error, id: providedId, children, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hasError = !!error;

    return (
      <Field>
        <Label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </Label>
        <div className="relative mt-1">
          <Select
            id={id}
            ref={ref}
            className={cn(
              'block w-full appearance-none rounded-md border shadow-sm transition-colors',
              'pl-3 pr-8 py-2 text-slate-900 placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              {
                'border-slate-300 hover:border-purple-400 focus:border-purple-500 focus:ring-purple-500':
                  !hasError,
                'border-red-500 text-red-900 focus:border-red-600 focus:ring-red-600': hasError,
              }
            )}
            {...props}
          >
            {children}
          </Select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-2.5 h-5 w-5 text-slate-400"
            aria-hidden="true"
          />
        </div>
        {(error || hint) && (
          <Description
            className={cn('mt-2 text-sm', {
              'text-red-600': hasError,
              'text-slate-500': !hasError,
            })}
          >
            {error || hint}
          </Description>
        )}
      </Field>
    );
  }
);
SelectField.displayName = 'SelectField';

export { SelectField };
