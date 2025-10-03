/* eslint-disable react-hooks/exhaustive-deps */
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { X } from 'lucide-react';

import { Fragment, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Button } from './Button';

type FormDialogProps = {
  triggerButton: ReactNode;
  title: string;
  children: ReactNode;
  isDone: boolean;
  submitButton: ReactNode;
  onClose?: () => void;
};

export const FormDialog = ({
  triggerButton,
  title,
  children,
  isDone,
  submitButton,
  onClose,
}: FormDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = useCallback(() => {
    setIsOpen(false)
    onClose?.();
  }, []);

  useEffect(() => {
    if (isDone) {
      close();
    }
  }, [isDone]);

  return (
    <>
      <div onClick={open}>{triggerButton}</div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={close}>
          <DialogBackdrop className="fixed inset-0 bg-black/30" />

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between">
                    <DialogTitle as="h3" className="text-lg font-medium leading-6 text-slate-900">
                      {title}
                    </DialogTitle>
                    <button
                      type="button"
                      onClick={close}
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                      aria-label="Close dialog"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="mt-4">{children}</div>

                  <div className="mt-8 flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={close}>
                      Cancel
                    </Button>
                    {submitButton}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
