import { useCallback, useState } from "react";

export function useDisclosure(defaultValue?: boolean) {
  const [isOpen, setIsOpen] = useState(defaultValue || false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, open, close };
}