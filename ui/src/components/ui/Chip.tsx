import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";

const chipVariants = cva(
  'inline-flex items-center justify-center rounded-md border-2 font-regular transition-colors h-7 px-4 text-sm',
  {
    variants: {
      intent: {
        default: 'border-[#EAECF0] bg-[#F9FAFB] text-dark',
        secondary: 'border-[#EAECF0] bg-transparent text-dark',
        success: 'border-[#ABEFC6] bg-[#ECFDF3] text-[#067647]',
        warning: 'border-[#FEDF89] bg-[#FFFAEB] text-[#B54708]',
      },
    },
    defaultVariants: {
      intent: 'default',
    },
  }
);

export type ChipProps = React.ComponentProps<"div"> & VariantProps<typeof chipVariants>;

const Chip = (props: ChipProps) => {
  const { children, intent, ...rest } = props;

  return (
    <div className={chipVariants({ intent })} {...rest}>
      {children}
    </div>
  );
}

Chip.displayName = 'Chip';

export { Chip };
