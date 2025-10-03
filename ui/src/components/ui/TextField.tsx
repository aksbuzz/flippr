import { Description, Field, Input, Label } from '@headlessui/react';
import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, hint, error, id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const hasError = !!error;

    return (
      <Field>
        <Label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </Label>
        <div className="mt-1">
          <Input
            id={id}
            ref={ref}
            className={cn(
              'block w-full rounded-md border shadow-sm transition-colors',
              'px-3 py-2 text-slate-900 placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              {
                'border-slate-300 hover:border-purple-400 focus:border-purple-500 focus:ring-purple-500':
                  !hasError,
                'border-red-500 text-red-900 focus:border-red-600 focus:ring-red-600': hasError,
              }
            )}
            {...props}
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
TextField.displayName = 'TextField';

export { TextField };
