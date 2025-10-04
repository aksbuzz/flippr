import {
  Description,
  Dialog as HeadlessDialog,
  DialogBackdrop as HeadlessDialogBackdrop,
  DialogPanel as HeadlessDialogPanel,
  DialogTitle as HeadlessDialogTitle,
} from '@headlessui/react';
import { X } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Button } from './Button';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function Dialog({ open, onClose, children }: DialogProps) {
  return (
    <HeadlessDialog
      open={open}
      as="div"
      className="relative z-10 focus:outline-none"
      onClose={onClose}
    >
      {children}
    </HeadlessDialog>
  );
}

export function DialogBackdrop() {
  return <HeadlessDialogBackdrop className="fixed inset-0 bg-black/30" />;
}

export function DialogContainer({ children }: PropsWithChildren) {
  return (
    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">{children}</div>
    </div>
  );
}

export function DialogPanel({ children }: PropsWithChildren) {
  return (
    <HeadlessDialogPanel
      transition
      className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all"
    >
      {children}
    </HeadlessDialogPanel>
  );
}

export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="absolute top-4 right-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
      aria-label="Close dialog"
    >
      <X size={20} />
    </button>
  );
}

export function DialogTitle({ children }: PropsWithChildren) {
  return (
    <HeadlessDialogTitle as="h3" className="text-lg font-medium leading-6 text-dark">
      {children}
    </HeadlessDialogTitle>
  );
}

export function DialogDescription({ children }: PropsWithChildren) {
  return <Description className="mt-2 text-sm/6 text-white/50">{children}</Description>;
}

export function DialogActions({ children }: PropsWithChildren) {
  return <div className="mt-4 flex justify-end gap-3">{children}</div>;
}

type BasicDialogBaseProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  withClose?: boolean;
};

type BasicDialogWithActions = BasicDialogBaseProps & {
  withActions: true;
  onSubmit: () => void;
};

type BasicDialogWithoutActions = BasicDialogBaseProps & {
  withActions?: false;
  onSubmit?: never;
};

type BasicDialogProps = BasicDialogWithActions | BasicDialogWithoutActions;

export function BasicDialog(props: BasicDialogProps) {
  const { isOpen, onClose, title, withClose, withActions, onSubmit } = props;
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogBackdrop />

      <DialogContainer>
        <DialogPanel>
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            {withClose && <DialogClose onClose={onClose} />}
          </div>
          <div className="mt-4">{props.children}</div>

          {withActions && (
            <DialogActions>
              <div className="mt-8 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="default" onClick={onSubmit}>
                  Cancel
                </Button>
              </div>
            </DialogActions>
          )}
        </DialogPanel>
      </DialogContainer>
    </Dialog>
  );
}
