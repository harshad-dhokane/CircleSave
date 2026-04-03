import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CopyButtonProps = {
  value: string;
  successMessage?: string;
  label?: string;
  showLabel?: boolean;
  className?: string;
} & Pick<VariantProps<typeof buttonVariants>, 'variant' | 'size'>;

export function CopyButton({
  value,
  successMessage = 'Copied to clipboard',
  label = 'Copy',
  showLabel = false,
  variant = 'outline',
  size = 'icon-sm',
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;

    const timeoutId = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    if (!value) {
      toast.error('Nothing to copy');
      return;
    }

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }

      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(successMessage);
    } catch {
      toast.error('Unable to copy right now');
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={showLabel ? 'sm' : size}
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : label}
      className={cn(showLabel && 'gap-1.5', className)}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {showLabel ? (copied ? 'Copied' : label) : null}
    </Button>
  );
}
