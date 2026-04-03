import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  Loader2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/hooks/useWallet';
import { useCreateCircle } from '@/hooks/useCircle';
import { Button } from '@/components/ui/button';
import { ProcessInfoButton } from '@/components/help/ProcessInfoButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  CircleCategory,
  CircleType,
  formatAmount,
  getCategoryLabel,
  getCircleTypeLabel,
} from '@/lib/constants';

const CIRCLE_TYPES = [
  { value: CircleType.OPEN, label: 'Open', disabled: false },
  { value: CircleType.APPROVAL_REQUIRED, label: 'Approval', disabled: false },
  { value: CircleType.INVITE_ONLY, label: 'Invite only', disabled: true },
] as const;

const CATEGORIES = [
  { value: CircleCategory.FRIENDS, label: getCategoryLabel(CircleCategory.FRIENDS) },
  { value: CircleCategory.FAMILY, label: getCategoryLabel(CircleCategory.FAMILY) },
  { value: CircleCategory.COWORKERS, label: getCategoryLabel(CircleCategory.COWORKERS) },
  { value: CircleCategory.NEIGHBORS, label: getCategoryLabel(CircleCategory.NEIGHBORS) },
  { value: CircleCategory.INTEREST, label: getCategoryLabel(CircleCategory.INTEREST) },
] as const;

export function CreateCirclePage() {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const { createCircle, isSubmitting, voyagerUrl, error: createError } = useCreateCircle();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('100');
  const [maxMembers, setMaxMembers] = useState(10);
  const [circleType, setCircleType] = useState<number>(CircleType.OPEN);
  const [category, setCategory] = useState<number>(CircleCategory.FRIENDS);
  const [collateralRatio, setCollateralRatio] = useState(150);

  const totalPot = BigInt(Math.floor(parseFloat(monthlyAmount) || 0)) * BigInt(maxMembers) * BigInt(1e18);
  const collateralAmount = BigInt(Math.floor(parseFloat(monthlyAmount) || 0)) * BigInt(collateralRatio) / BigInt(100) * BigInt(1e18);
  const canSubmit = name.trim().length > 0
    && description.trim().length > 0
    && parseFloat(monthlyAmount) > 0
    && maxMembers >= 2
    && maxMembers <= 50
    && circleType !== CircleType.INVITE_ONLY;
  const isBusy = isSubmitting;

  const handleCreate = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!canSubmit) {
      toast.error(
        circleType === CircleType.INVITE_ONLY
          ? 'Invite-only circles are temporarily disabled until owner-managed invites are implemented.'
          : 'Complete the required circle details first',
      );
      return;
    }

    const result = await createCircle({
      name,
      description,
      monthlyAmount,
      maxMembers,
      circleType,
      category,
      collateralRatio,
    });

    if (result.ok) {
      toast.success(
        <div>
          Circle created.{' '}
          <a href={result.voyagerUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            View on Voyager
          </a>
        </div>,
      );
      navigate('/circles');
    } else {
      toast.error(result.error || createError || 'Failed to create circle');
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-4 pb-4">
        <section className="neo-panel p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/6 text-white">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Connect to create a circle
          </h2>
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={() => navigate('/circles')}>
              View existing circles
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="neo-panel p-4 md:p-5">
          <div className="mb-5 flex items-start justify-between gap-3 border-b border-black/8 pb-5 dark:border-white/10">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Step 1
              </p>
              <h2 className="mt-1 font-display text-[1.3rem] font-semibold tracking-[-0.04em] text-foreground">
                Circle setup
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Define the group, contribution size, access style, and member count before you review and create the circle.
              </p>
            </div>
            <ProcessInfoButton
              title="Create circle setup"
              description="These fields define the core circle before anyone joins."
              items={[
                {
                  label: 'Circle type',
                  description: 'Open circles allow direct joins. Approval circles collect requests first. Invite-only is temporarily disabled until owner-managed invites are implemented.',
                },
                {
                  label: 'Monthly amount',
                  description: 'This is the amount each member is expected to contribute for the round.',
                },
                {
                  label: 'Members and collateral',
                  description: 'Member count sets the rotation length. Collateral ratio controls how much protection members lock relative to the monthly amount.',
                },
                {
                  label: 'Start simple',
                  description: 'If this is your first run, use a short name, a clear description, and a moderate member count such as 5 to 10.',
                },
              ]}
              footer="Review the summary on the right, then submit the circle once everything matches the group you want to launch."
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="name" className="mb-2 block text-sm font-semibold">Circle name</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={31}
                placeholder="Team save"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description" className="mb-2 block text-sm font-semibold">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={31}
                placeholder="Short on-chain description"
                className="min-h-[110px]"
              />
            </div>

            <div>
              <Label htmlFor="monthly" className="mb-2 block text-sm font-semibold">Monthly amount</Label>
              <Input
                id="monthly"
                type="number"
                min="1"
                value={monthlyAmount}
                onChange={(event) => setMonthlyAmount(event.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-semibold">Circle type</Label>
              <Select value={circleType.toString()} onValueChange={(value) => setCircleType(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CIRCLE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value.toString()} disabled={type.disabled}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                Invite-only creation is temporarily disabled until owner-managed invites are added.
              </p>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-semibold">Category</Label>
              <Select value={category.toString()} onValueChange={(value) => setCategory(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item.value} value={item.value.toString()}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <Label className="text-sm font-semibold">Members</Label>
                <span className="text-sm text-muted-foreground">{maxMembers}</span>
              </div>
              <Slider
                value={[maxMembers]}
                onValueChange={(value) => setMaxMembers(value[0])}
                min={2}
                max={50}
                step={1}
                className="py-3"
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Label className="text-sm font-semibold">Collateral ratio</Label>
                <span className="text-sm text-muted-foreground">{(collateralRatio / 100).toFixed(2)}x</span>
              </div>
              <Slider
                value={[collateralRatio]}
                onValueChange={(value) => setCollateralRatio(value[0])}
                min={100}
                max={255}
                step={5}
                className="py-3"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate('/circles')}>
              Cancel
            </Button>
            <Button variant="amber" onClick={handleCreate} disabled={!canSubmit || isBusy}>
              {isBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Circle
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {createError ? (
            <div className="mt-4 rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
              {createError}
            </div>
          ) : null}
        </section>

        <div className="space-y-4">
          <section className="neo-panel p-4 md:p-5">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Monthly', value: `${monthlyAmount || '0'} STRK`, bg: 'bg-[#B5F36B]', border: 'border-[#9ad255]/30', text: 'text-slate-950' },
                { label: 'Members', value: maxMembers, bg: 'bg-[#FFB457]', border: 'border-[#e09938]/30', text: 'text-slate-950' },
                { label: 'Collateral', value: `${(collateralRatio / 100).toFixed(2)}x`, bg: 'bg-[#A48DFF]', border: 'border-[#8a6fe0]/30', text: 'text-slate-950' },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-[16px] border px-3.5 py-3 shadow-[0_16px_36px_-22px_rgba(15,23,42,0.16)] ${item.bg} ${item.border}`}
                >
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${item.text} opacity-70`}>
                    {item.label}
                  </p>
                  <p className={`mt-1 text-sm font-semibold ${item.text}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Step 2
                </p>
                <h3 className="font-display text-[1.25rem] font-semibold tracking-[-0.04em] text-foreground">
                  Review
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="neo-chip">{getCircleTypeLabel(circleType)}</div>
                <ProcessInfoButton
                  title="Circle review"
                  description="This panel shows the exact circle you are about to submit."
                  items={[
                    {
                      label: 'Monthly and total pot',
                      description: 'Monthly is the expected contribution for one member. Total pot is the estimated amount the full group will rotate through.',
                    },
                    {
                      label: 'Collateral',
                      description: 'Collateral is calculated from your monthly amount and ratio. It is designed to protect the group if someone misses a payment.',
                    },
                    {
                      label: 'When to submit',
                      description: 'Submit when these values match the structure you want new members to see and join.',
                    },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-3">
              {[
                ['Category', getCategoryLabel(category)],
                ['Monthly', `${monthlyAmount || '0'} STRK`],
                ['Members', `${maxMembers}`],
                ['Collateral', formatAmount(collateralAmount)],
                ['Total pot', formatAmount(totalPot)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-[20px] border border-black/10 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>

            {voyagerUrl ? (
              <a
                href={voyagerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                Open latest Voyager transaction
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
