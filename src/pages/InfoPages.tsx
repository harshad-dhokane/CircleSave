import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  FileCode2,
  Network,
  ScrollText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HowItWorks } from '@/sections/HowItWorks';
import { Leaderboard } from '@/sections/Leaderboard';
import { cn } from '@/lib/utils';

const VOYAGER_CONTRACT_BASE = 'https://sepolia.voyager.online/contract/';

const deploymentManifest = {
  deployedAt: '2026-03-31T15:44:32.396Z',
  rpcUrl: 'https://starknet-sepolia-rpc.publicnode.com',
  classHashes: [
    {
      name: 'Circle',
      value: '0x4c335c8e9efb1f6c5a4b24b11559f990db4cf95b161c22852060136e16c93e7',
    },
    {
      name: 'CircleFactory',
      value: '0x4def1a9cc90f71e7e46c9c56dcef84f36a04ee25fd0d0dca74adbd0ca58d1be',
    },
    {
      name: 'Reputation',
      value: '0x10cce0cc5ba43cf0d689fbbce7541512e174a65bd05d4b0bca5348f99ce3493',
    },
    {
      name: 'CollateralManager',
      value: '0x20ee0f9477fac76857cd261d44d565bfbc9e7e614c2d28307cccafcd075e5af',
    },
  ],
  contracts: [
    {
      name: 'Reputation',
      value: '0x5f67b0d4c13b2d1919f85494783746995157cb88b3de2999fa12db021cd5395',
    },
    {
      name: 'Collateral Manager',
      value: '0x30437d641289c541df8f3a5f3f3a9fc6795d1622941a0cef682874c2d9e1b8b',
    },
    {
      name: 'Circle Factory',
      value: '0x59f8d156789b2c2dba46a36998dfff79f83acc6e6f355f09d3cc42cca97500',
    },
  ],
} as const;

const accentClasses = {
  lime: 'border-[#B5F36B]/24 bg-[#B5F36B]/14 text-foreground',
  amber: 'border-[#FFB457]/24 bg-[#FFB457]/16 text-foreground',
  sky: 'border-[#7CC8FF]/24 bg-[#7CC8FF]/14 text-foreground',
  violet: 'border-[#A48DFF]/24 bg-[#A48DFF]/16 text-foreground',
  mint: 'border-[#7AE7C7]/24 bg-[#7AE7C7]/14 text-foreground',
  rose: 'border-[#FF7B72]/24 bg-[#FF7B72]/16 text-foreground',
} as const;

type AccentTone = keyof typeof accentClasses;

type HeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  tone: AccentTone;
  actions?: ReactNode;
};

function AccentBadge({
  tone,
  className,
  children,
}: {
  tone: AccentTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
        accentClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

function InfoPageHeader(props: HeaderProps) {
  return (
    <section className="neo-panel p-5 md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <AccentBadge tone={props.tone}>{props.eyebrow}</AccentBadge>
          <h1 className="mt-3 font-display text-[1.9rem] font-semibold tracking-[-0.05em] text-foreground md:text-[2.35rem]">
            {props.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {props.description}
          </p>
        </div>
        {props.actions ? <div className="flex flex-wrap gap-3">{props.actions}</div> : null}
      </div>
    </section>
  );
}

function PolicySection(props: { title: string; body: string }) {
  return (
    <article className="rounded-[20px] border border-black/10 bg-black/[0.03] p-5 shadow-[0_18px_46px_-32px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_22px_56px_-34px_rgba(0,0,0,0.78)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Policy
      </p>
      <h2 className="mt-2 font-display text-[1.25rem] font-semibold tracking-[-0.04em] text-foreground">
        {props.title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {props.body}
      </p>
    </article>
  );
}

function RouteLinkCard({
  to,
  label,
}: {
  to: string;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3 text-sm font-semibold text-foreground transition duration-200 hover:-translate-y-0.5 hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

export function LeaderboardPage() {
  return (
    <div className="space-y-4 pb-4">
      <InfoPageHeader
        eyebrow="Community"
        title="Leaderboard"
        description="Track the strongest reputation wallets in CircleSave and see who is building the deepest on-chain circle history."
        tone="sky"
        actions={(
          <Button asChild>
            <Link to="/dashboard">Open Dashboard</Link>
          </Button>
        )}
      />
      <Leaderboard />
    </div>
  );
}

export function HowItWorksPage() {
  return (
    <div className="space-y-4 pb-4">
      <InfoPageHeader
        eyebrow="Product Flow"
        title="How CircleSave Works"
        description="Connect once, join or create circles, use StarkZap-powered actions from the same wallet session, and keep every move visible in the dashboard and logs."
        tone="mint"
        actions={(
          <>
            <Button asChild>
              <Link to="/circles">
                Explore Circles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/swap">Open Swap</Link>
            </Button>
          </>
        )}
      />
      <HowItWorks />
    </div>
  );
}

export function ContractsPage() {
  return (
    <div className="space-y-4 pb-4">
      <InfoPageHeader
        eyebrow="On-Chain"
        title="Smart Contracts"
        description="CircleSave runs on Starknet Sepolia with a deployed circle factory, collateral manager, and reputation system. These are the live addresses used by the app."
        tone="amber"
        actions={(
          <Button variant="outline" asChild>
            <Link to="/help">Open Help Center</Link>
          </Button>
        )}
      />

      <section className="grid gap-4 xl:grid-cols-3">
        {deploymentManifest.contracts.map((contract) => (
          <a
            key={contract.name}
            href={`${VOYAGER_CONTRACT_BASE}${contract.value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-[20px] border border-black/10 bg-black/[0.03] p-5 transition duration-200 hover:-translate-y-0.5 hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <AccentBadge tone="lime">Live Contract</AccentBadge>
              <ExternalLink className="h-4.5 w-4.5 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
            </div>
            <h2 className="font-display text-[1.25rem] font-semibold tracking-[-0.04em] text-foreground">
              {contract.name}
            </h2>
            <p className="mt-3 break-all font-mono text-sm leading-6 text-muted-foreground">
              {contract.value}
            </p>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Open in Voyager
            </p>
          </a>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="neo-panel p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <AccentBadge tone="mint">
              <BookOpen className="h-3.5 w-3.5" />
              Deployment Metadata
            </AccentBadge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Deployed At
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {new Date(deploymentManifest.deployedAt).toLocaleString()}
              </p>
            </div>
            <div className="rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                RPC Endpoint
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-foreground">
                {deploymentManifest.rpcUrl}
              </p>
            </div>
          </div>
        </div>

        <div className="neo-panel p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <AccentBadge tone="violet">
              <FileCode2 className="h-3.5 w-3.5" />
              Class Hashes
            </AccentBadge>
          </div>
          <div className="mt-5 space-y-3">
            {deploymentManifest.classHashes.map((item) => (
              <div
                key={item.name}
                className="rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-4 dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {item.name}
                </p>
                <p className="mt-2 break-all font-mono text-sm leading-6 text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function ApiPage() {
  return (
    <div className="space-y-4 pb-4">
      <InfoPageHeader
        eyebrow="Integration"
        title="API & App Architecture"
        description="CircleSave does not expose a separate public backend REST API. The app is driven by Starknet contracts, StarkZap v2 providers, and wallet-signed on-chain actions."
        tone="violet"
        actions={(
          <>
            <Button asChild>
              <Link to="/swap">Open Swap</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/logs">View Logs</Link>
            </Button>
          </>
        )}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="neo-panel p-5 md:p-6">
          <AccentBadge tone="amber">
            <Network className="h-3.5 w-3.5" />
            What Powers The App
          </AccentBadge>
          <div className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Circle creation, contributions, collateral, and reputation are handled by Starknet smart contracts.</p>
            <p>Swap and DCA flows run through StarkZap v2 provider integrations and execute from the user&apos;s connected wallet.</p>
            <p>Logs and dashboard activity are contract-backed views built from public factory, circle, collateral, and reputation events.</p>
          </div>
        </div>

        <div className="neo-panel p-5 md:p-6">
          <AccentBadge tone="sky">
            <ScrollText className="h-3.5 w-3.5" />
            Useful Product Routes
          </AccentBadge>
          <div className="mt-5 grid gap-3">
            <RouteLinkCard to="/help" label="Help Center" />
            <RouteLinkCard to="/circles" label="Discover Circles" />
            <RouteLinkCard to="/swap" label="Swap" />
            <RouteLinkCard to="/dca" label="DCA" />
            <RouteLinkCard to="/lending" label="Lending" />
            <RouteLinkCard to="/logs" label="Logs" />
          </div>
        </div>
      </section>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="space-y-4 pb-4">
      <InfoPageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description="CircleSave is a prototype experience for exploring savings circles and StarkZap-enabled Starknet actions. Use of the app is subject to the limitations described below."
        tone="rose"
      />
      <section className="grid gap-4 lg:grid-cols-3">
        <PolicySection
          title="Prototype Use"
          body="CircleSave is provided as an experimental application. Features, interfaces, routes, and on-chain flows may change, be interrupted, or be removed without notice."
        />
        <PolicySection
          title="Wallet Responsibility"
          body="You are responsible for the wallet, account permissions, signatures, and transactions submitted through the app. Always review wallet prompts carefully before confirming."
        />
        <PolicySection
          title="No Guarantee"
          body="The app does not guarantee uptime, successful transactions, liquidity availability, or uninterrupted access to Starknet, StarkZap providers, or third-party RPC services."
        />
      </section>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="space-y-4 pb-4">
      <InfoPageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="CircleSave is designed around wallet-based access and on-chain transparency. This page explains the limited app-level data the interface may surface."
        tone="sky"
      />
      <section className="grid gap-4 lg:grid-cols-3">
        <PolicySection
          title="Wallet Data"
          body="The app reads wallet addresses, token balances, connected account state, and on-chain transaction information needed to show dashboard details, logs, and product actions."
        />
        <PolicySection
          title="On-Chain Transparency"
          body="Transactions you submit through the app are public on Starknet and may be visible through explorers such as Voyager, regardless of the interface used to initiate them."
        />
        <PolicySection
          title="No Custody"
          body="CircleSave does not custody user funds. Transactions are signed by the connected wallet, and asset movement is controlled by the user and the relevant smart contracts."
        />
      </section>
    </div>
  );
}

export function RiskDisclosurePage() {
  return (
    <div className="space-y-4 pb-4">
      <InfoPageHeader
        eyebrow="Legal"
        title="Risk Disclosure"
        description="Using CircleSave involves smart-contract, wallet, liquidity, and testnet risks. Review these points before using swap, DCA, lending, or savings-circle flows."
        tone="amber"
      />
      <section className="grid gap-4 lg:grid-cols-3">
        <PolicySection
          title="Smart Contract Risk"
          body="CircleSave and connected protocol integrations rely on smart contracts. Bugs, unexpected edge cases, or third-party integration failures can affect outcomes or transaction success."
        />
        <PolicySection
          title="Liquidity & Routing Risk"
          body="Swap and DCA availability depend on live provider routes and market liquidity. Quotes may fail, routes may disappear, and execution results may vary with market conditions."
        />
        <PolicySection
          title="Testnet Conditions"
          body="This build currently runs on Starknet Sepolia. Testnet assets may be faucet-funded, unstable, or non-representative of mainnet conditions, and infrastructure can be unreliable."
        />
      </section>
    </div>
  );
}
