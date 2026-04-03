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
import {
  type StarkZapDcaFrequency,
  type StarkZapDcaProviderId,
  type StarkZapTokenKey,
  useStarkZapActions,
} from '@/hooks/useStarkZapActions';
import { Button } from '@/components/ui/button';
import { ProcessInfoButton } from '@/components/help/ProcessInfoButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  { value: CircleType.OPEN, label: 'Open' },
  { value: CircleType.APPROVAL_REQUIRED, label: 'Approval' },
  { value: CircleType.INVITE_ONLY, label: 'Invite only' },
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
  const {
    dcaProviderOptions,
    launchCircleWithAutomation,
    recommendedExecutionMode,
    supportsSponsoredExecution,
  } = useStarkZapActions();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('100');
  const [maxMembers, setMaxMembers] = useState(10);
  const [circleType, setCircleType] = useState<number>(CircleType.OPEN);
  const [category, setCategory] = useState<number>(CircleCategory.FRIENDS);
  const [collateralRatio, setCollateralRatio] = useState(150);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [automationSellToken, setAutomationSellToken] = useState<StarkZapTokenKey>('USDC');
  const [automationBudget, setAutomationBudget] = useState('300');
  const [automationPerCycle, setAutomationPerCycle] = useState('100');
  const [automationFrequency, setAutomationFrequency] = useState<StarkZapDcaFrequency>('P1W');
  const [automationProvider, setAutomationProvider] = useState<StarkZapDcaProviderId>('avnu');
  const [isLaunchingAutomation, setIsLaunchingAutomation] = useState(false);
  const feeMode = recommendedExecutionMode === 'sponsored' && supportsSponsoredExecution
    ? 'sponsored'
    : 'user_pays';

  const totalPot = BigInt(Math.floor(parseFloat(monthlyAmount) || 0)) * BigInt(maxMembers) * BigInt(1e18);
  const collateralAmount = BigInt(Math.floor(parseFloat(monthlyAmount) || 0)) * BigInt(collateralRatio) / BigInt(100) * BigInt(1e18);
  const canSubmit = name.trim().length > 0
    && description.trim().length > 0
    && parseFloat(monthlyAmount) > 0
    && maxMembers >= 2
    && maxMembers <= 50;
  const isBusy = isSubmitting || isLaunchingAutomation;

  const handleCreate = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!canSubmit) {
      toast.error('Complete the required circle details first');
      return;
    }

    if (automationEnabled) {
      try {
        setIsLaunchingAutomation(true);
        const tx = await launchCircleWithAutomation({
          circle: {
            name,
            description,
            monthlyAmount,
            maxMembers,
            circleType,
            category,
            collateralRatio,
          },
          automation: {
            enabled: true,
            sellToken: automationSellToken,
            sellAmount: automationBudget,
            sellAmountPerCycle: automationPerCycle,
            frequency: automationFrequency,
            providerId: automationProvider,
          },
          feeMode,
        });

        toast.success(
          <div>
            Circle and automation submitted.{' '}
            <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
              View on Voyager
            </a>
          </div>,
        );
        navigate('/circles');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to launch circle automation';
        toast.error(message);
      } finally {
        setIsLaunchingAutomation(false);
      }
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
                Define the group, contribution size, access style, and member count before you review or add automation.
              </p>
            </div>
            <ProcessInfoButton
              title="Create circle setup"
              description="These fields define the core circle before anyone joins."
              items={[
                {
                  label: 'Circle type',
                  description: 'Open circles allow direct joins, approval circles collect requests first, and invite-only circles keep membership tightly controlled.',
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
              footer="You can create a plain circle first, or keep auto-funding on and submit both flows together."
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
                    <SelectItem key={type.value} value={type.value.toString()}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {automationEnabled ? 'Launching...' : 'Creating...'}
                </>
              ) : (
                <>
                  {automationEnabled ? 'Launch Circle + Funding' : 'Create Circle'}
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

          <section className="neo-panel p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Step 3
                </p>
                <h3 className="font-display text-[1.25rem] font-semibold tracking-[-0.04em] text-foreground">
                  Auto-funding
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={automationEnabled} onCheckedChange={setAutomationEnabled} />
                <ProcessInfoButton
                  title="Circle auto-funding"
                  description="Automation is optional. It adds a recurring StarkZap DCA plan alongside the circle."
                  items={[
                    {
                      label: 'Sell token and budget',
                      description: 'Choose the asset you want to spend and the total budget available for the recurring plan.',
                    },
                    {
                      label: 'Per cycle and frequency',
                      description: 'Per cycle controls how much budget is used each run. Frequency controls how often the order executes.',
                    },
                    {
                      label: 'Provider',
                      description: 'The provider controls where the DCA order routes. Use the one with the strongest live support for your pair.',
                    },
                    {
                      label: 'When to disable',
                      description: 'Turn automation off if you only want the circle itself and prefer to fund manually later.',
                    },
                  ]}
                />
              </div>
            </div>

            {automationEnabled ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-2 block text-sm font-semibold">Sell token</Label>
                  <Select value={automationSellToken} onValueChange={(value) => setAutomationSellToken(value as StarkZapTokenKey)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="STRK">STRK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-semibold">Provider</Label>
                  <Select value={automationProvider} onValueChange={(value) => setAutomationProvider(value as StarkZapDcaProviderId)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dcaProviderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-semibold">Budget</Label>
                  <Input value={automationBudget} onChange={(event) => setAutomationBudget(event.target.value)} />
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-semibold">Per cycle</Label>
                  <Input value={automationPerCycle} onChange={(event) => setAutomationPerCycle(event.target.value)} />
                </div>

                <div className="sm:col-span-2">
                  <Label className="mb-2 block text-sm font-semibold">Frequency</Label>
                  <Select value={automationFrequency} onValueChange={(value) => setAutomationFrequency(value as StarkZapDcaFrequency)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PT12H">Every 12 Hours</SelectItem>
                      <SelectItem value="P1D">Daily</SelectItem>
                      <SelectItem value="P1W">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-black/10 px-4 py-8 text-sm text-muted-foreground dark:border-white/10">
                The circle will be created without an automation plan.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
