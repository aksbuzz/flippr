import { Fieldset as HeadlessFieldset } from '@headlessui/react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export type FieldSetProps = HTMLAttributes<HTMLDivElement>

export const FieldSet = ({ className, children }: FieldSetProps) => {
  return <HeadlessFieldset className={cn('space-y-6', className)}>{children}</HeadlessFieldset>;
};
