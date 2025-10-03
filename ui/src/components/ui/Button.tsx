import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';

const buttonVariants = cva(
  'inline-flex items-center cursor-pointer justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary border-primary-700 text-white hover:bg-primary-700 active:bg-primary-700 focus-visible:ring-primary-200',
        secondary:
          'border-2 border-primary text-primary bg-white hover:bg-primary/10 active:bg-primary/10 focus-visible:ring-primary-200',
        error:
          'bg-error text-white border-error-700 hover:bg-error-700 active:bg-error-700 focus-visible:ring-error-200',
        tertiary:
          'text-primary underline bg-transparent hover:text-primary-700 active:text-primary-700 focus-visible:ring-primary-200',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
  };

export type IconButtonProps = Omit<ButtonProps, 'variant' | 'size' | 'isLoading'>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, children, size, isLoading, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {isLoading && <Spinner size="sm" className="text-current" />}
        <span className="mx-2">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
