import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowRightLeft,
  Blocks,
  BookOpen,
  Bug,
  Code2,
  FileText,
  PiggyBank,
  Repeat,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStarkZapLogs } from '@/hooks/useStarkZapLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type GuideTopic = {
  id: string;
  label: string;
  summary: string;
  color: string;
  icon: typeof Sparkles;
};

type FeatureRoute = {
  label: string;
  to: string;
};

type FeatureMapEntry = {
  title: string;
  summary: string;
  color: string;
  icon: typeof Sparkles;
  routes: FeatureRoute[];
  files: string[];
};

type SnippetEntry = {
  title: string;
  file: string;
  summary: string;
  code: string;
};

type WorkspaceGuideEntry = {
  title: string;
  body: string;
  color: string;
  route: FeatureRoute;
};

const guideTopics: GuideTopic[] = [
  {
    id: 'overview',
    label: 'Overview',
    summary: 'What the app does now and what changed in this build.',
    color: '#FF6B6B',
    icon: Sparkles,
  },
  {
    id: 'workspace',
    label: 'Workspace',
    summary: 'Where to start, what each menu item does, and how to move through the app.',
    color: '#7CC8FF',
    icon: BookOpen,
  },
  {
    id: 'wallet-network',
    label: 'Wallet + Network',
    summary: 'How login, Sepolia, gasless, and execution modes work.',
    color: '#4ECDC4',
    icon: Wallet,
  },
  {
    id: 'circle-flows',
    label: 'Circle Flows',
    summary: 'Discover, create, join, contribute, and track circles.',
    color: '#FFE66D',
    icon: Users,
  },
  {
    id: 'automation',
    label: 'Automation',
    summary: 'Launch circles with DCA and fund circles from inside the detail page.',
    color: '#96CEB4',
    icon: Sparkles,
  },
  {
    id: 'swap',
    label: 'Swap',
    summary: 'Best-route and forced-provider StarkZap swap flow.',
    color: '#4ECDC4',
    icon: ArrowRightLeft,
  },
  {
    id: 'batching',
    label: 'Batching',
    summary: 'User-defined TxBuilder batches with mixed tokens and recipients.',
    color: '#F4A261',
    icon: Blocks,
  },
  {
    id: 'dca',
    label: 'DCA',
    summary: 'Recurring order model, previews, refresh, and cancellation.',
    color: '#FFE66D',
    icon: Repeat,
  },
  {
    id: 'lending',
    label: 'Lending',
    summary: 'Vesu deposit, withdraw, borrow, repay, and health preview.',
    color: '#96CEB4',
    icon: PiggyBank,
  },
  {
    id: 'visibility',
    label: 'Logs + Dashboard',
    summary: 'Public CircleSave logs plus shared StarkZap registry activity and wallet-specific dashboard views.',
    color: '#DDA0DD',
    icon: FileText,
  },
  {
    id: 'sdk-map',
    label: 'Feature Map',
    summary: 'Where each StarkZap v2 feature is wired into the product.',
    color: '#F4A261',
    icon: Blocks,
  },
  {
    id: 'code-snippets',
    label: 'Code Snippets',
    summary: 'Implementation examples from the current codebase.',
    color: '#45B7D1',
    icon: Code2,
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting',
    summary: 'Known Sepolia and wallet caveats in the current build.',
    color: '#FF6B6B',
    icon: Bug,
  },
] as const;

const workspaceGuide: WorkspaceGuideEntry[] = [
  {
    title: 'Circles',
    body: 'This is the default signed-in home. Browse all circles, filter by status, and open any circle detail page to join, contribute, or manage a round.',
    color: '#B5F36B',
    route: { label: 'Open Circles', to: '/circles' },
  },
  {
    title: 'Create Circle',
    body: 'Use the setup form to launch a new savings circle, choose members, contribution amount, collateral ratio, and review the configuration before submitting.',
    color: '#FFB457',
    route: { label: 'Create Circle', to: '/circles/create' },
  },
  {
    title: 'Dashboard',
    body: 'Review your personal operating snapshot, active circles, recent activity, and the routes you will probably jump into next.',
    color: '#7AE7C7',
    route: { label: 'Open Dashboard', to: '/dashboard' },
  },
  {
    title: 'Swap, Batch, DCA, Lend',
    body: 'These are the automation workspaces. Use them to route assets, send multi-transfer batches, create recurring buy plans, or manage Vesu lending positions.',
    color: '#A48DFF',
    route: { label: 'Open Swap', to: '/swap' },
  },
  {
    title: 'Logs',
    body: 'Use Logs when you want the public contract-backed activity feed shared by everyone, not wallet-local browser history.',
    color: '#FF6B6B',
    route: { label: 'View Logs', to: '/logs' },
  },
  {
    title: 'Profile + Help',
    body: 'Profile shows balances, reputation, and wallet-specific history. Help is the handbook you are reading now and explains what every route does.',
    color: '#7CC8FF',
    route: { label: 'Open Profile', to: '/profile' },
  },
] as const;

const featureMap: FeatureMapEntry[] = [
  {
    title: 'Cartridge Wallet Session + Sponsored Execution Detection',
    summary:
      'CircleSave connects through the Cartridge controller connector, then StarkZap actions reuse that same account and only enable sponsored execution when the wallet exposes paymaster execution.',
    color: '#FF6B6B',
    icon: Wallet,
    routes: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Swap', to: '/swap' },
      { label: 'DCA', to: '/dca' },
      { label: 'Lending', to: '/lending' },
    ],
    files: [
      'src/lib/starknet.ts',
      'src/lib/starkzapConnectedWallet.ts',
      'src/hooks/useWallet.ts',
      'src/hooks/useStarkZapActions.ts',
    ],
  },
  {
    title: 'Multi-Provider Swap Comparison',
    summary:
      'The swap workspace compares AVNU and Ekubo, surfaces a best route option, and can still force a specific provider when the user wants to test a venue directly.',
    color: '#4ECDC4',
    icon: ArrowRightLeft,
    routes: [
      { label: 'Swap', to: '/swap' },
      { label: 'Circle Detail', to: '/circles' },
    ],
    files: [
      'src/pages/SwapPage.tsx',
      'src/hooks/useStarkZapActions.ts',
    ],
  },
  {
    title: 'Provider-Aware DCA Orders',
    summary:
      'The DCA workspace previews a cycle, creates AVNU or Ekubo recurring orders, reloads active orders, and supports order cancellation from the same page.',
    color: '#FFE66D',
    icon: Repeat,
    routes: [
      { label: 'DCA', to: '/dca' },
      { label: 'Create Circle', to: '/circles/create' },
    ],
    files: [
      'src/pages/DcaPage.tsx',
      'src/pages/CreateCirclePage.tsx',
      'src/hooks/useStarkZapActions.ts',
    ],
  },
  {
    title: 'Vesu Lending Actions',
    summary:
      'The lending workspace supports deposit, withdraw, withdraw max, borrow, repay, max-borrow quotes, and health simulations through StarkZap v2 Vesu integration.',
    color: '#96CEB4',
    icon: PiggyBank,
    routes: [
      { label: 'Lending', to: '/lending' },
      { label: 'Circle Detail', to: '/circles' },
    ],
    files: [
      'src/pages/LendingPage.tsx',
      'src/components/circles/CircleFundingStudio.tsx',
      'src/hooks/useStarkZapActions.ts',
    ],
  },
  {
    title: 'Transaction Batching Demo',
    summary:
      'The dedicated batching page uses the StarkZap v2 TxBuilder directly so judges can preview and send a user-defined mixed-token batch from one wallet signature.',
    color: '#F4A261',
    icon: Blocks,
    routes: [
      { label: 'Batching', to: '/batching' },
      { label: 'Logs', to: '/logs' },
    ],
    files: [
      'src/pages/BatchingPage.tsx',
      'src/hooks/useStarkZapActions.ts',
      'src/lib/starkzapActivityRegistry.ts',
    ],
  },
  {
    title: 'Atomic Circle Funding',
    summary:
      'Circle detail pages can chain StarkZap funding with circle actions, so the app can swap or pull liquidity first and then join or contribute in the same sequence.',
    color: '#DDA0DD',
    icon: Sparkles,
    routes: [
      { label: 'Circle Detail', to: '/circles' },
    ],
    files: [
      'src/components/circles/CircleFundingStudio.tsx',
      'src/hooks/useStarkZapActions.ts',
      'src/lib/circleCalls.ts',
    ],
  },
  {
    title: 'Create Circle Flow',
    summary:
      'Circle creation now focuses on the core factory-backed flow so users can launch a plain circle first and use funding tools separately when needed.',
    color: '#F4A261',
    icon: Blocks,
    routes: [
      { label: 'Create Circle', to: '/circles/create' },
    ],
    files: [
      'src/pages/CreateCirclePage.tsx',
      'src/lib/circleCalls.ts',
    ],
  },
  {
    title: 'Public Logs + Wallet Activity',
    summary:
      'The logs page reads public contract events plus the shared StarkZap registry, while the dashboard filters shared StarkZap activity to the connected wallet and its circles.',
    color: '#45B7D1',
    icon: FileText,
    routes: [
      { label: 'Logs', to: '/logs' },
      { label: 'Dashboard', to: '/dashboard' },
    ],
    files: [
      'src/hooks/useOnchainActivityFeed.ts',
      'src/hooks/useStarkZapLogs.ts',
      'src/pages/LogsPage.tsx',
      'src/pages/ProfilePage.tsx',
    ],
  },
] as const;

const codeSnippets: SnippetEntry[] = [
  {
    title: 'Cartridge Connector + Paymaster Setup',
    file: 'src/lib/starknet.ts',
    summary:
      'The app exposes a single Cartridge controller connector and configures the AVNU paymaster for sponsored execution when the wallet supports it.',
    code: String.raw`const cartridgeConnector = new ControllerConnector({
  defaultChainId: constants.StarknetChainId.SN_SEPOLIA,
  rpcUrl: CARTRIDGE_RPC_URL,
  chains: [{ rpcUrl: CARTRIDGE_RPC_URL }],
  policies: [],
  lazyload: true,
});

export const connectors = [cartridgeConnector];
export const paymasterProvider = avnuPaymasterProvider({
  apiKey: AVNU_PAYMASTER_API_KEY,
});`,
  },
  {
    title: 'Register StarkZap Providers On The Connected Wallet',
    file: 'src/lib/starkzapConnectedWallet.ts',
    summary:
      'The custom StarkZap wallet adapter keeps AVNU as the default provider set, then registers Ekubo for swap and DCA so the UI can compare venues.',
    code: String.raw`super({
  address: fromAddress(options.address),
  defaultSwapProvider: new AvnuSwapProvider(),
  defaultLendingProvider: new VesuLendingProvider(),
  defaultDcaProvider: new AvnuDcaProvider(),
});

this.registerSwapProvider(new EkuboSwapProvider());
this.dca().registerProvider(new EkuboDcaProvider());`,
  },
  {
    title: 'TxBuilder Multi-Transfer Batch',
    file: 'src/pages/BatchingPage.tsx',
    summary:
      'The judge-facing batching demo lets each row pick its own token, then groups them into one TxBuilder chain before signing.',
    code: String.raw`const tx = await wallet.tx()
  .transfer(sepoliaTokens.STRK, [
    { to: fromAddress(recipientOne), amount: Amount.parse('0.05', sepoliaTokens.STRK) },
    { to: fromAddress(recipientTwo), amount: Amount.parse('0.10', sepoliaTokens.STRK) },
  ])
  .transfer(sepoliaTokens.USDC, [
    { to: fromAddress(recipientThree), amount: Amount.parse('1', sepoliaTokens.USDC) },
  ])
  .send();`,
  },
  {
    title: 'Atomic Swap + Circle Action',
    file: 'src/hooks/useStarkZapActions.ts',
    summary:
      'Inside the circle funding studio, the app can swap into STRK, approve the circle contract, and immediately join or contribute through one StarkZap builder chain.',
    code: String.raw`const builder = wallet.tx()
  .swap({
    provider: providerId,
    tokenIn: sourceToken,
    tokenOut: strkToken,
    amountIn: Amount.parse(params.sourceAmount, sourceToken),
    slippageBps: 100n,
  })
  .approve(
    strkToken,
    fromAddress(params.circleAddress),
    Amount.fromRaw(params.requiredStrkAmount, strkToken),
  )
  .add(
    params.action === 'join'
      ? buildJoinCircleCall(params.circleAddress)
      : buildContributeCall(params.circleAddress),
  );`,
  },
  {
    title: 'Create Circle Factory Call',
    file: 'src/lib/circleCalls.ts',
    summary:
      'The create page now submits a plain factory-backed circle creation call without bundling launch-time automation.',
    code: String.raw`return populateContractCall(CIRCLE_FACTORY_ABI, CONTRACTS.CIRCLE_FACTORY, 'create_circle', [
  nameAsFelt,
  descriptionAsFelt,
  cairo.uint256(monthlyAmountWei),
  params.maxMembers,
  toCairoEnum(params.circleType, ['OPEN', 'APPROVAL_REQUIRED', 'INVITE_ONLY']),
  toCairoEnum(params.category, ['FRIENDS', 'FAMILY', 'COWORKERS', 'NEIGHBORS', 'INTEREST']),
  params.collateralRatio,
]);`,
  },
  {
    title: 'Dashboard Activity Filter',
    file: 'src/pages/ProfilePage.tsx',
    summary:
      'Dashboard activity is contract-backed and shows both direct wallet events and events from circles the wallet belongs to.',
    code: String.raw`const myActivityEntries = activityEntries.filter((entry) => {
  if (entry.actor?.toLowerCase() === normalizedAddress) {
    return true;
  }

  return entry.circleAddress
    ? userCircleAddressSet.has(entry.circleAddress.toLowerCase())
    : false;
});`,
  },
  {
    title: 'Shared StarkZap Registry Write',
    file: 'src/lib/starkzapActivityRegistry.ts',
    summary:
      'Shared swap, batch, DCA, and lending records are appended into the same wallet-signed transaction so analytics and logs are contract-backed instead of browser-local.',
    code: String.raw`const activityCall = buildStarkZapActivityCall({
  module: 'swap',
  action: 'execute',
  provider: providerId,
  executionMode,
  volumes: [
    { token: params.tokenIn, amount: amountIn.toBase() },
    { token: params.tokenOut, amount: prepared.quote.amountOutBase },
  ],
});

const tx = await wallet.execute(
  activityCall ? [...prepared.calls, activityCall] : prepared.calls,
  toExecutionOptions(executionMode),
);`,
  },
] as const;

const troubleshootingTips = [
  {
    title: 'Swap or DCA says there is no route',
    body:
      'Sepolia liquidity is thin. If a pair has no AVNU or Ekubo route, try STRK -> ETH first, then test the rest of the flow from there.',
  },
  {
    title: 'Gasless mode is unavailable',
    body:
      'The app only enables sponsored execution when the connected account exposes paymaster execution. If the toggle is disabled, switch to User Pays.',
  },
  {
    title: 'Logs page is empty',
    body:
      'The public logs page depends on live CircleSave contract addresses. If the environment variables point to 0x0 or the contracts have not emitted events yet, the feed will be empty.',
  },
  {
    title: 'Dashboard activity looks smaller than the public logs',
    body:
      'That is expected. The dashboard only shows events tied to the connected wallet or circles that wallet belongs to. The logs page is the full public contract feed.',
  },
  {
    title: 'RPC or balance reads fail',
    body:
      'Sepolia infrastructure can be noisy. Public RPC and Cartridge balance calls may briefly fail, so refresh once and try again after a short pause.',
  },
  {
    title: 'DCA did not auto-pay the circle',
    body:
      'The current implementation uses DCA to accumulate STRK for circle funding. It does not automatically submit the future monthly contribution transaction itself.',
  },
] as const;

const helpCardClass = 'rounded-[20px] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5';
const helpAccentCardClass = 'rounded-[20px] border border-amber-500/18 bg-amber-500/10 p-5 dark:border-amber-400/18 dark:bg-amber-400/10';
const helpKickerClass = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground';
const helpTitleClass = 'mt-2 font-display font-semibold tracking-[-0.03em] text-foreground';
const helpBodyClass = 'mt-3 text-[15px] leading-relaxed text-muted-foreground';

function RoutePill(props: FeatureRoute) {
  return (
    <Link
      to={props.to}
      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground shadow-[0_14px_30px_-22px_rgba(15,23,42,0.18)] transition-colors hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
    >
      {props.label}
    </Link>
  );
}

function FilePill(props: { path: string }) {
  return (
    <div className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 font-mono text-[12px] text-foreground/78 backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
      {props.path}
    </div>
  );
}

function TopicTabTrigger(props: { topic: GuideTopic; active: boolean }) {
  const Icon = props.topic.icon;

  return (
    <TabsTrigger
      value={props.topic.id}
      className={cn(
        'flex-none min-w-[170px] shrink-0 justify-start rounded-[18px] border px-3 py-2.5 text-left text-[13px] font-semibold uppercase tracking-[0.1em] transition-all sm:min-w-[188px] xl:min-w-0 xl:w-full xl:flex-1',
        props.active
          ? 'border-[#0f172a]/72 bg-[#0f172a] text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.62)] hover:bg-[#162131] dark:border-[#0f172a]/72 dark:bg-[#0f172a] dark:text-white dark:hover:bg-[#162131]'
          : 'border-black/10 bg-black/[0.03] text-foreground hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:text-foreground dark:hover:bg-white/8',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border shadow-[0_14px_28px_-20px_rgba(15,23,42,0.18)]"
          style={props.active
            ? {
              backgroundColor: props.topic.color,
              borderColor: props.topic.color,
              color: '#0f172a',
            }
            : {
              backgroundColor: `${props.topic.color}18`,
              borderColor: `${props.topic.color}45`,
              color: props.topic.color,
            }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm">{props.topic.label}</p>
        </div>
      </div>
    </TabsTrigger>
  );
}

function HelpSection(props: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  color: string;
  icon: typeof Sparkles;
  children: ReactNode;
}) {
  const Icon = props.icon;

  return (
    <section id={props.id} className="scroll-mt-28 neo-panel p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{
              backgroundColor: `${props.color}18`,
              borderColor: `${props.color}45`,
              color: props.color,
            }}
          >
            <Icon className="h-4 w-4" />
            {props.eyebrow}
          </div>
          <h2 className="font-display text-[1.65rem] font-semibold tracking-[-0.04em] text-foreground md:text-[2rem]">{props.title}</h2>
          <p className="mt-3 max-w-4xl text-[15px] leading-7 text-muted-foreground">{props.description}</p>
        </div>
      </div>
      {props.children}
    </section>
  );
}

function BulletList(props: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {props.items.map((item) => (
        <li key={item} className="flex gap-3 text-[15px] leading-7 text-muted-foreground">
          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SnippetCard(props: SnippetEntry) {
  return (
    <div className="neo-panel overflow-hidden p-0">
      <div className="content-divider-bottom bg-transparent p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{props.file}</p>
        <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">{props.title}</h3>
        <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{props.summary}</p>
      </div>
      <pre className="overflow-x-auto bg-[#070b12] p-5 text-[13px] leading-relaxed text-white dark:bg-[#04060b]">
        <code>{props.code}</code>
      </pre>
    </div>
  );
}

export function SdkPage() {
  const [activeTopic, setActiveTopic] = useState<GuideTopic['id']>('overview');
  const contentRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToContentRef = useRef(false);
  const { hasConfiguredRegistry, logs: sharedStarkZapLogs } = useStarkZapLogs();

  const challengeMetrics = useMemo(() => {
    const modules = new Set(sharedStarkZapLogs.map((entry) => entry.kind));
    const sponsoredCount = sharedStarkZapLogs.filter((entry) => entry.executionMode === 'sponsored').length;
    const circleAutomationCount = sharedStarkZapLogs.filter((entry) => entry.title === 'Launch Circle + DCA').length;

    return {
      totalRecords: sharedStarkZapLogs.length,
      modules: modules.size,
      sponsoredCount,
      circleAutomationCount,
    };
  }, [sharedStarkZapLogs]);

  useEffect(() => {
    if (!shouldScrollToContentRef.current) return;
    shouldScrollToContentRef.current = false;

    if (window.innerWidth >= 1280) return;

    window.requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [activeTopic]);

  return (
    <div className="space-y-6 pb-4">
      <section className="neo-panel p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Help Center
            </p>
            <h1 className="mt-2 font-display text-[1.7rem] font-semibold tracking-[-0.04em] text-foreground md:text-[2rem]">
              Application guide and feature reference
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use this page to learn what each route does, how circles and automation fit together, and where to look when you need public logs, wallet activity, or troubleshooting help.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="mint">
              <Link to="/circles">
                Open Circles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="sky">
              <Link to="/swap">Swap</Link>
            </Button>
            <Button asChild size="sm" variant="amber">
              <Link to="/batching">Batching</Link>
            </Button>
            <Button asChild size="sm" variant="sky">
              <Link to="/logs">Logs</Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Guide sections', value: guideTopics.length, bg: 'bg-[#B5F36B]', border: 'border-[#9ad255]/30' },
            { label: 'Start here', value: 'Circles first', bg: 'bg-[#FFB457]', border: 'border-[#e09938]/30' },
            { label: 'Shared StarkZap', value: hasConfiguredRegistry ? `${challengeMetrics.totalRecords} records` : 'Registry pending', bg: 'bg-[#7CC8FF]', border: 'border-[#66b8ef]/30' },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-[18px] border px-4 py-3 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)] ${item.bg} ${item.border}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-950/70">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="page-shell py-1 md:py-1">
        <Tabs
          value={activeTopic}
          onValueChange={(value) => {
            shouldScrollToContentRef.current = true;
            setActiveTopic(value as GuideTopic['id']);
          }}
          className="w-full animate-fade-in gap-4 xl:grid xl:grid-cols-[252px_minmax(0,1fr)] xl:items-start xl:gap-5 2xl:gap-6"
        >
          <aside className="space-y-3 xl:sticky xl:top-[88px] xl:self-start">
            <TabsList className="neo-panel h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:flex-col xl:flex-nowrap xl:items-stretch xl:overflow-visible">
              {guideTopics.map((topic) => (
                <TopicTabTrigger key={topic.id} topic={topic} active={activeTopic === topic.id} />
              ))}
            </TabsList>
          </aside>

          <div ref={contentRef} className="mt-1 min-w-0 scroll-mt-24 xl:mt-0">
            <TabsContent value="overview" className="mt-0">
              <HelpSection
                id="overview"
                eyebrow="Current Build"
                title="What CircleSave Does Today"
                description="CircleSave is a Starknet Sepolia savings-circle app with real circle creation, join, and contribution flows, plus StarkZap-powered swap, DCA, lending, public logs, and contract-backed dashboard activity."
                color="#FF6B6B"
                icon={Sparkles}
              >
                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: 'Shared StarkZap records',
                      value: String(challengeMetrics.totalRecords),
                      detail: hasConfiguredRegistry ? 'contract-backed feed' : 'awaiting registry address',
                    },
                    {
                      label: 'Live modules',
                      value: String(challengeMetrics.modules),
                      detail: 'swap, batch, DCA, lend',
                    },
                    {
                      label: 'Sponsored records',
                      value: String(challengeMetrics.sponsoredCount),
                      detail: 'gasless executions',
                    },
                    {
                      label: 'Circle launch bundles',
                      value: String(challengeMetrics.circleAutomationCount),
                      detail: 'create circle + DCA',
                    },
                  ].map((item) => (
                    <div key={item.label} className={helpCardClass}>
                      <p className={helpKickerClass}>{item.label}</p>
                      <p className="mt-3 text-2xl font-semibold text-foreground">{item.value}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      title: 'Create + Join Circles',
                      body: 'Factory-backed circle flows are live and tracked on-chain.',
                      color: '#FF6B6B',
                    },
                    {
                      title: 'Create Plain Circles',
                      body: 'New circles are launched through the factory flow first, then funded separately when needed.',
                      color: '#FFE66D',
                    },
                    {
                      title: 'Fund From Swap Or Lending',
                      body: 'Circle detail pages can route through StarkZap before the final join or contribute action.',
                      color: '#4ECDC4',
                    },
                    {
                      title: 'Verify Through Contracts',
                      body: 'Logs and dashboard activity are contract-backed, including shared StarkZap registry records.',
                      color: '#96CEB4',
                    },
                  ].map((item) => (
                    <div key={item.title} className={helpCardClass}>
                      <div className="mb-3 h-2.5 w-14 rounded-full" style={{ backgroundColor: item.color }} />
                      <p className="text-lg font-semibold text-foreground">{item.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>What Changed</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'The old SDK summary page has been replaced by this route-level guide so the product now has one place that explains the real implementation.',
                          'The dedicated batching route now supports user-defined row count with mixed-token transfers in one TxBuilder transaction.',
                          'Circle creation can launch with a recurring STRK DCA order, and circle detail pages include embedded StarkZap funding flows.',
                          'The public logs page now reads CircleSave contract events plus the shared StarkZap registry directly from Starknet without requiring a wallet connection.',
                          'Dashboard activity now reads shared StarkZap activity for the connected wallet instead of browser-local transaction history.',
                        ]}
                      />
                    </div>
                  </div>

                  <div className={helpAccentCardClass}>
                    <p className={helpKickerClass}>Use This Guide For</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'Understanding what each route is supposed to do before you click into it.',
                          'Seeing which StarkZap v2 features are already implemented versus what is only planned.',
                          'Finding the exact files that own batching, swap, DCA, lending, circle funding, logs, shared registry analytics, and dashboard activity.',
                          'Copying working code patterns from the snippets section into future features.',
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </HelpSection>
            </TabsContent>

            <TabsContent value="workspace" className="mt-0">
              <HelpSection
                id="workspace"
                eyebrow="How To Use The App"
                title="Start With Circles, Then Move Into The Right Workspace"
                description="The product is designed to open into Circles first, then branch into creation, automation, logs, profile, and help depending on what you need next."
                color="#7CC8FF"
                icon={BookOpen}
              >
                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>Recommended First Run</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'Connect your wallet once from the landing page or shell header.',
                          'Open Circles first to browse active, pending, owned, and joined circles.',
                          'Create a circle if you are launching a new group, or open a circle detail page if you want to join or contribute.',
                          'Use Swap, DCA, Batching, or Lending when you need to fund or automate actions before coming back to a circle.',
                          'Check Logs for the shared public contract feed and Dashboard/Profile for wallet-specific activity, balances, and reputation.',
                        ]}
                      />
                    </div>
                  </div>

                  <div className={helpAccentCardClass}>
                    <p className={helpKickerClass}>What Help Covers</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'What each menu item is for.',
                          'Which features are available on each route.',
                          'How CircleSave circle actions connect to StarkZap automation.',
                          'What is public for all users versus wallet-specific.',
                          'Which usage metrics are now shared through the StarkZap registry.',
                          'What current Sepolia limits or caveats you should expect.',
                        ]}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {workspaceGuide.map((item) => (
                    <div key={item.title} className={helpCardClass}>
                      <div className="mb-4 h-2.5 w-14 rounded-full" style={{ backgroundColor: item.color }} />
                      <h3 className="font-display text-xl font-semibold tracking-[-0.03em] text-foreground">{item.title}</h3>
                      <p className={helpBodyClass}>{item.body}</p>
                      <div className="mt-4">
                        <RoutePill {...item.route} />
                      </div>
                    </div>
                  ))}
                </div>
              </HelpSection>
            </TabsContent>

            <TabsContent value="wallet-network" className="mt-0">
              <HelpSection
                id="wallet-network"
                eyebrow="Wallet Model"
                title="Wallet, Network, And Execution Mode"
                description="The current build is deliberately opinionated: one social-login connector, one Sepolia environment, one shared wallet session across every route."
                color="#4ECDC4"
                icon={Wallet}
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>Wallet Setup</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'The app currently exposes the Cartridge controller connector only.',
                          'Users connect once from the header and the same account is reused in circles, swap, DCA, lending, logs, and dashboard activity.',
                          'This keeps the challenge demo stable and avoids wallet-mode glitches from unsupported connector paths.',
                        ]}
                      />
                    </div>
                  </div>

                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>Network Setup</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'Everything is pointed at Starknet Sepolia.',
                          'PublicNode is used as the default JSON-RPC provider and Cartridge RPC is used for balance-related reads.',
                          'The paymaster provider is configured for AVNU sponsored execution.',
                          'Shared StarkZap analytics are read from the on-chain activity registry when its address is configured.',
                        ]}
                      />
                    </div>
                  </div>

                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>Gasless Rules</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'Gasless mode only appears when the connected account exposes paymaster execution.',
                          'If sponsored execution is unavailable, the UI falls back to User Pays and disables the gasless option.',
                          'This logic is handled in the StarkZap action hook and the custom connected wallet adapter.',
                        ]}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <FilePill path="src/lib/starknet.ts" />
                  <FilePill path="src/lib/starkzapConnectedWallet.ts" />
                  <FilePill path="src/hooks/useWallet.ts" />
                  <FilePill path="src/hooks/useStarkZapActions.ts" />
                </div>
              </HelpSection>
            </TabsContent>

            <TabsContent value="circle-flows" className="mt-0">
              <HelpSection
                id="circle-flows"
                eyebrow="CircleSave Core"
                title="Circle Discovery, Creation, Join, And Contribution"
                description="The app is still centered on savings circles. StarkZap improves funding and automation around that core, but the base circle flows remain on-chain CircleSave contract actions."
                color="#FF6B6B"
                icon={Users}
              >
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>Discover</p>
                    <h3 className={cn(helpTitleClass, 'text-xl')}>Browse Existing Circles</h3>
                    <p className={helpBodyClass}>
                      The discover route pulls circles from the factory and surfaces current amount, members, type, category, and status.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <RoutePill to="/circles" label="Discover Circles" />
                      <FilePill path="src/hooks/useCircle.ts" />
                    </div>
                  </div>

                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>Create</p>
                    <h3 className={cn(helpTitleClass, 'text-xl')}>Launch A New Circle</h3>
                    <p className={helpBodyClass}>
                      The create page is a two-step form for name, description, amount, members, type, category, collateral ratio, and final review before submission.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <RoutePill to="/circles/create" label="Create Circle" />
                      <FilePill path="src/pages/CreateCirclePage.tsx" />
                    </div>
                  </div>

                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>Participate</p>
                    <h3 className={cn(helpTitleClass, 'text-xl')}>Join And Contribute</h3>
                    <p className={helpBodyClass}>
                      Circle detail pages can approve STRK and then join or contribute. When StarkZap is used, those funding steps are chained before the circle action.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <RoutePill to="/dashboard" label="Dashboard" />
                      <FilePill path="src/pages/CircleDetailPage.tsx" />
                      <FilePill path="src/hooks/useCircle.ts" />
                    </div>
                  </div>
                </div>

                <div className={cn(helpAccentCardClass, 'mt-6')}>
                  <p className={helpKickerClass}>What Gets Written On-Chain</p>
                  <div className="mt-4">
                    <BulletList
                      items={[
                        'Circle creation emits factory events and stores the new circle contract address.',
                        'Member joins, approvals, contributions, payouts, missed payments, and slashing emit circle events.',
                        'Collateral and reputation changes emit their own contract events, which later feed the logs page and the dashboard activity tab.',
                      ]}
                    />
                  </div>
                </div>
              </HelpSection>
            </TabsContent>

            <TabsContent value="automation" className="mt-0">
              <HelpSection
                id="automation"
                eyebrow="Funding Automation"
                title="Standalone Automation And In-Circle Funding"
                description="This is where CircleSave becomes more than a plain savings-circle app. The current build keeps StarkZap automation in the dedicated workspaces and inside circle participation flows instead of bundling it into circle creation."
                color="#FFE66D"
                icon={Sparkles}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>DCA Workspace</p>
                    <h3 className={cn(helpTitleClass, 'text-2xl')}>Recurring STRK Plan</h3>
                    <p className={helpBodyClass}>
                      Recurring DCA orders are created from the dedicated DCA page. The user chooses sell token, total budget, per-cycle amount, frequency, provider, and execution mode there.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <RoutePill to="/dca" label="Open DCA" />
                      <FilePill path="src/pages/DcaPage.tsx" />
                      <FilePill path="src/hooks/useStarkZapActions.ts" />
                    </div>
                  </div>

                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>Circle Detail Studio</p>
                    <h3 className={cn(helpTitleClass, 'text-2xl')}>Swap, DCA, Or Pull From Lending</h3>
                    <p className={helpBodyClass}>
                      On the circle detail page, users can compare swap providers, set up a recurring STRK plan, or borrow/withdraw from Vesu before finishing the join or contribution action.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <RoutePill to="/circles" label="Open A Circle" />
                      <FilePill path="src/components/circles/CircleFundingStudio.tsx" />
                      <FilePill path="src/hooks/useStarkZapActions.ts" />
                    </div>
                  </div>
                </div>

                <div className={cn(helpAccentCardClass, 'mt-6')}>
                  <p className={helpKickerClass}>Important Implementation Note</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-foreground/82 dark:text-white/82">
                    The current DCA implementation buys STRK for future circle funding, but it does not automatically submit the future monthly contribution transaction itself.
                    Immediate circle actions are handled by the swap and lending funding flows.
                  </p>
                </div>
              </HelpSection>
            </TabsContent>

            <TabsContent value="swap" className="mt-0">
              <HelpSection
                id="swap"
                eyebrow="Swap Workspace"
                title="Best-Route Swap Flow"
                description="The swap route is the cleanest place to inspect StarkZap v2 routing directly. It compares providers, supports a best-route mode, and executes from the shared CircleSave wallet."
                color="#4ECDC4"
                icon={ArrowRightLeft}
              >
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>User Flow</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'Choose a recommended route or build a custom token pair manually.',
                          'Preview AVNU and Ekubo outputs or let Best Route choose the leading venue.',
                          'Switch between User Pays and Gasless when sponsored execution is supported by the connected wallet.',
                          'Execute the route and keep the transaction hash plus explorer link in the page state.',
                        ]}
                      />
                    </div>
                  </div>

                  <div className={helpAccentCardClass}>
                    <p className={helpKickerClass}>Implementation Notes</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'Best Route compares providers through the StarkZap action hook instead of hardcoding one venue.',
                          'The recommended Sepolia first test route remains STRK -> ETH because testnet liquidity is more reliable there.',
                          'The same compare-and-send builder logic is reused by the in-circle funding studio for swap-based join or contribute actions.',
                        ]}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <RoutePill to="/swap" label="Open Swap" />
                      <FilePill path="src/pages/SwapPage.tsx" />
                      <FilePill path="src/hooks/useStarkZapActions.ts" />
                      <FilePill path="src/lib/starkzapActivityRegistry.ts" />
                    </div>
                  </div>
                </div>
              </HelpSection>
            </TabsContent>

            <TabsContent value="batching" className="mt-0">
              <HelpSection
                id="batching"
                eyebrow="TxBuilder Demo"
                title="User-Defined Batch Transactions"
                description="The batching route is the clearest place to inspect StarkZap v2 TxBuilder batching directly. Users can add as many rows as they want, pick different tokens per row, and sign one atomic transaction."
                color="#F4A261"
                icon={Blocks}
              >
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>What The Page Supports</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'Users can add or remove transfer rows dynamically instead of working with a fixed batch size.',
                          'Each row can target a different recipient address.',
                          'Each row can also choose a different token, so one transaction can mix STRK, ETH, and USDC transfers.',
                          'Preview resolves the final Starknet call count and checks simulation before the wallet signature step.',
                        ]}
                      />
                    </div>
                  </div>

                  <div className={helpAccentCardClass}>
                    <p className={helpKickerClass}>Implementation Notes</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'The action hook groups rows by token and chains multiple .transfer(...) steps into one wallet.tx() builder.',
                          'The batching page shows token subtotals so users can understand how the mixed-asset batch resolves before signing.',
                          'Submitted batch transactions are written into the shared StarkZap registry flow alongside swap, DCA, and lending actions.',
                        ]}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <RoutePill to="/batching" label="Open Batching" />
                      <FilePill path="src/pages/BatchingPage.tsx" />
                      <FilePill path="src/hooks/useStarkZapActions.ts" />
                      <FilePill path="src/lib/starkzapActivityRegistry.ts" />
                    </div>
                  </div>
                </div>
              </HelpSection>
            </TabsContent>

            <TabsContent value="dca" className="mt-0">
              <HelpSection
                id="dca"
                eyebrow="Recurring Orders"
                title="DCA Order Model"
                description="The DCA route is not just a form submit. It previews one cycle, creates provider-specific orders, loads live orders back into the page, and supports cancellation."
                color="#FFE66D"
                icon={Repeat}
              >
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>How A DCA Order Works Here</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'Total Sell Amount is the full order budget.',
                          'Sell Per Cycle is how much gets spent each time the order runs.',
                          'Frequency supports 12 hours, daily, and weekly presets in the current UI.',
                          'Preview estimates one cycle, while the order list tracks the ongoing provider-backed order state.',
                        ]}
                      />
                    </div>
                  </div>

                  <div className={helpAccentCardClass}>
                    <p className={helpKickerClass}>What Is Implemented</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'AVNU and Ekubo provider selection.',
                          'Live order refresh and provider filtering.',
                          'On-page cancellation through StarkZap cancel flow.',
                          'Standalone DCA setup and in-circle DCA setup reuse the same underlying DCA create action.',
                        ]}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <RoutePill to="/dca" label="Open DCA" />
                      <FilePill path="src/pages/DcaPage.tsx" />
                      <FilePill path="src/hooks/useStarkZapActions.ts" />
                    </div>
                  </div>
                </div>
              </HelpSection>
            </TabsContent>

            <TabsContent value="lending" className="mt-0">
              <HelpSection
                id="lending"
                eyebrow="Vesu Liquidity"
                title="Lending, Borrowing, And Health Preview"
                description="The lending route owns the standalone Vesu interaction surface, while circle detail pages reuse lending actions when liquidity needs to flow back into a circle action."
                color="#96CEB4"
                icon={PiggyBank}
              >
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>Working Actions</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'Deposit and withdraw a fixed amount.',
                          'Withdraw max in one action.',
                          'Borrow against a selected collateral asset.',
                          'Repay debt and preview the resulting health path.',
                          'Load market snapshots, open positions, max borrow quotes, and health simulations.',
                        ]}
                      />
                    </div>
                  </div>

                  <div className={helpAccentCardClass}>
                    <p className={helpKickerClass}>Where It Shows Up</p>
                    <div className="mt-4">
                      <BulletList
                        items={[
                          'The standalone lending route is the full Vesu workspace.',
                          'The circle detail funding studio can withdraw, withdraw max, or borrow before the final join/contribute action.',
                          'If the source asset is not STRK, the app can still swap into STRK before finishing the circle step.',
                        ]}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <RoutePill to="/lending" label="Open Lending" />
                      <FilePill path="src/pages/LendingPage.tsx" />
                      <FilePill path="src/components/circles/CircleFundingStudio.tsx" />
                      <FilePill path="src/hooks/useStarkZapActions.ts" />
                    </div>
                  </div>
                </div>
              </HelpSection>
            </TabsContent>

            <TabsContent value="visibility" className="mt-0">
              <HelpSection
                id="visibility"
                eyebrow="Verification"
                title="Public Logs And Wallet-Specific Dashboard Activity"
                description="These two surfaces are related but intentionally different. One is public for everyone; the other is filtered for the connected wallet and its circles."
                color="#DDA0DD"
                icon={FileText}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>Logs Page</p>
                    <h3 className={cn(helpTitleClass, 'text-2xl')}>Public Contract Feed</h3>
                    <p className={helpBodyClass}>
                      The logs route reads factory, circle, reputation, and collateral events directly from Starknet. It does not require wallet login and does not depend on browser-local storage.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <RoutePill to="/logs" label="Open Logs" />
                      <FilePill path="src/pages/LogsPage.tsx" />
                      <FilePill path="src/hooks/useOnchainActivityFeed.ts" />
                    </div>
                  </div>

                  <div className={helpCardClass}>
                    <p className={helpKickerClass}>Dashboard Activity</p>
                    <h3 className={cn(helpTitleClass, 'text-2xl')}>Connected Wallet View</h3>
                    <p className={helpBodyClass}>
                      The dashboard activity tab reads the same contract-backed feed, then filters it to direct wallet events and events from circles the wallet belongs to. It is not browser-storage history.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <RoutePill to="/dashboard" label="Open Dashboard" />
                      <FilePill path="src/pages/ProfilePage.tsx" />
                      <FilePill path="src/hooks/useOnchainActivityFeed.ts" />
                    </div>
                  </div>
                </div>
              </HelpSection>
            </TabsContent>

            <TabsContent value="sdk-map" className="mt-0">
              <HelpSection
                id="sdk-map"
                eyebrow="Implementation Map"
                title="Where StarkZap v2 Is Implemented"
                description="This section maps each user-facing feature to the route and file that actually owns it, so you can move from product behavior to code quickly."
                color="#F4A261"
                icon={Blocks}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {featureMap.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.title} className={helpCardClass}>
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border"
                            style={{
                              backgroundColor: `${item.color}18`,
                              borderColor: `${item.color}45`,
                              color: item.color,
                            }}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex flex-wrap justify-end gap-2">
                            {item.routes.map((route) => (
                              <RoutePill key={`${item.title}-${route.to}`} {...route} />
                            ))}
                          </div>
                        </div>
                        <h3 className="font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">{item.title}</h3>
                        <p className={helpBodyClass}>{item.summary}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.files.map((file) => (
                            <FilePill key={`${item.title}-${file}`} path={file} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </HelpSection>
            </TabsContent>

            <TabsContent value="code-snippets" className="mt-0">
              <HelpSection
                id="code-snippets"
                eyebrow="Reference Snippets"
                title="Code Patterns Already Live In The App"
                description="These snippets are lifted from the current implementation patterns and are the fastest way to understand how CircleSave composes StarkZap v2 with its own circle contracts."
                color="#45B7D1"
                icon={Code2}
              >
                <div className="grid gap-6 xl:grid-cols-2">
                  {codeSnippets.map((snippet) => (
                    <SnippetCard key={snippet.title} {...snippet} />
                  ))}
                </div>
              </HelpSection>
            </TabsContent>

            <TabsContent value="troubleshooting" className="mt-0">
              <HelpSection
                id="troubleshooting"
                eyebrow="Known Caveats"
                title="Troubleshooting And Current Limitations"
                description="The guide is only useful if it is honest about testnet limits and current behavior. These are the main issues you should expect in the current Sepolia build."
                color="#FF6B6B"
                icon={Bug}
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {troubleshootingTips.map((tip) => (
                    <div key={tip.title} className={helpCardClass}>
                      <p className="text-lg font-semibold text-foreground">{tip.title}</p>
                      <p className={helpBodyClass}>{tip.body}</p>
                    </div>
                  ))}
                </div>
              </HelpSection>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
