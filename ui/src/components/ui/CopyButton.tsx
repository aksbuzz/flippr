import { Check, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { useCopyToClipboard } from '../../hooks';
import { cn } from '../../utils/cn';

type CopyButtonProps = {
  text: string;
  className?: string;
  delay?: number;
};

export const CopyButton = (props: CopyButtonProps) => {
  const { className, text, delay } = props;

  const [copied, setCopied] = useState(false);
  const [, copyToClipboard] = useCopyToClipboard();

  const handleCopy = async () => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), delay || 1000);
  };

  if (copied) {
    return <Check className={cn('size-4', className)} />;
  }

  return <CopyIcon className={cn('size-4 cursor-pointer', className)} onClick={handleCopy} />;
};
