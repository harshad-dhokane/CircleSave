import { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ProcessInfoItem = {
  label: string;
  description: string;
};

type ProcessInfoButtonProps = {
  title: string;
  description: string;
  items: ProcessInfoItem[];
  footer?: string;
  className?: string;
};

export function ProcessInfoButton({
  title,
  description,
  items,
  footer,
  className,
}: ProcessInfoButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label={`Open help for ${title}`}
        className={cn('rounded-full', className)}
      >
        <Info className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="pr-10">
            <div className="inline-flex w-fit rounded-full border border-[#7CC8FF]/20 bg-[#7CC8FF]/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
              Process help
            </div>
            <DialogTitle className="mt-2 text-[1.8rem] tracking-[-0.05em]">
              {title}
            </DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.label}
                className="rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-4 dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground/88 dark:text-white/86">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {footer ? (
            <div className="rounded-[20px] border border-[#B5F36B]/20 bg-[#B5F36B]/10 px-4 py-4 text-sm leading-6 text-foreground">
              {footer}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
