import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Description,
} from '@headlessui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { dismissAuthPrompt, setToken, useAuth } from '../../lib/auth';
import { Button } from '../ui/Button';
import { FieldSet } from '../ui/FieldSet';
import { TextField } from '../ui/TextField';

/** Shown after the API answers 401. Saves the admin token and refetches. */
export const AuthDialog = () => {
  const { authRequired, token } = useAuth();
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Admin token is required');
      return;
    }
    setError('');
    setValue('');
    setToken(trimmed);
    void queryClient.invalidateQueries();
  }

  return (
    <Dialog open={authRequired} onClose={dismissAuthPrompt} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 text-left shadow-xl">
          <form onSubmit={handleSubmit}>
            <DialogTitle as="h3" className="text-lg font-medium leading-6 text-dark">
              Enter admin token
            </DialogTitle>
            <Description className="mt-2 text-sm text-[#475467]">
              {token
                ? 'The server rejected the saved admin token. Enter a valid one to continue.'
                : 'This server requires an admin token.'}
            </Description>
            <div className="mt-4">
              <FieldSet>
                <TextField
                  label="Admin token"
                  name="admin_token"
                  type="password"
                  autoComplete="off"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  error={error}
                />
              </FieldSet>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={dismissAuthPrompt}>
                Cancel
              </Button>
              <Button type="submit">Save token</Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
