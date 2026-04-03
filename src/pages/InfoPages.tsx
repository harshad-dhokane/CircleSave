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

type HeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  accentClassName: string;
  actions?: ReactNode;
};

function InfoPageHeader(props: HeaderProps) {
  return (
    <div className="content-divider-bottom border-b-[2px] border-black bg-white">
      <div className="page-shell py-8 md:py-9">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className={`mb-3 inline-flex items-center gap-2 border-[2px] border-black px-3 py-1.5 text-sm font-black uppercase tracking-[0.08em] ${props.accentClassName}`}>
              {props.eyebrow}
            </div>
            <h1 className="mb-2 text-4xl font-black md:text-5xl">{props.title}</h1>
            <p className="max-w-3xl text-[15px] leading-relaxed text-black/70 md:text-base">
              {props.description}
            </p>
          </div>
          {props.actions ? <div className="flex flex-wrap gap-3">{props.actions}</div> : null}
        </div>
      </div>
    </div>
  );
}

function PolicySection(props: { title: string; body: string }) {
  return (
    <div className="border-[3px] border-black bg-white p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
      <h2 className="mb-3 text-2xl font-black">{props.title}</h2>
      <p className="text-[15px] leading-relaxed text-black/70">{props.body}</p>
    </div>
  );
}

export function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <InfoPageHeader
        eyebrow="Community Stats"
        title="Leaderboard"
        description="Track the highest reputation wallets in CircleSave and see who is building the strongest on-chain circle history."
        accentClassName="bg-[#FFE66D]"
        actions={
          <Link to="/dashboard">
            <Button className="neo-button-primary">Open Dashboard</Button>
          </Link>
        }
      />
      <Leaderboard />
    </div>
  );
}

export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <InfoPageHeader
        eyebrow="Product Flow"
        title="How CircleSave Works"
        description="Connect once, join or create circles, use StarkZap-powered actions from the same wallet, and keep every move visible in your dashboard and logs."
        accentClassName="bg-[#4ECDC4] text-white"
        actions={
          <>
            <Link to="/circles">
              <Button className="neo-button-primary">
                Explore Circles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/swap">
              <Button variant="outline" className="border-[2px] border-black font-black">
                Open Swap
              </Button>
            </Link>
          </>
        }
      />
      <HowItWorks />
    </div>
  );
}

export function ContractsPage() {
  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <InfoPageHeader
        eyebrow="On-Chain"
        title="Smart Contracts"
        description="CircleSave runs on Starknet Sepolia with a deployed circle factory, collateral manager, and reputation system. These are the current live addresses used by the app."
        accentClassName="bg-[#FF6B6B] text-white"
        actions={
          <Link to="/help">
            <Button className="neo-button-primary">
              Open Help Center
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        }
      />

      <div className="page-shell space-y-8 py-8 md:py-10">
        <section className="grid gap-4 md:grid-cols-3">
          {deploymentManifest.contracts.map((contract) => (
            <a
              key={contract.name}
              href={`${VOYAGER_CONTRACT_BASE}${contract.value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block border-[3px] border-black bg-white p-6 shadow-[4px_4px_0px_0px_#1a1a1a] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_#1a1a1a]"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 border-[2px] border-black bg-[#FFE66D] px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em]">
                  Live Contract
                </div>
                <ExternalLink className="h-5 w-5" />
              </div>
              <h2 className="mb-3 text-2xl font-black">{contract.name}</h2>
              <p className="break-all font-mono text-sm text-black/70">{contract.value}</p>
            </a>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="border-[3px] border-black bg-white p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="mb-4 inline-flex items-center gap-2 border-[2px] border-black bg-[#4ECDC4] px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-white">
              <BookOpen className="h-4 w-4" />
              Deployment Metadata
            </div>
            <div className="space-y-3 text-[15px]">
              <p><span className="font-black">Deployed At:</span> {new Date(deploymentManifest.deployedAt).toLocaleString()}</p>
              <p className="break-all"><span className="font-black">RPC:</span> {deploymentManifest.rpcUrl}</p>
            </div>
          </div>

          <div className="border-[3px] border-black bg-white p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
            <div className="mb-4 inline-flex items-center gap-2 border-[2px] border-black bg-[#DDA0DD] px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em]">
              <FileCode2 className="h-4 w-4" />
              Class Hashes
            </div>
            <div className="space-y-3">
              {deploymentManifest.classHashes.map((item) => (
                <div key={item.name}>
                  <p className="font-black">{item.name}</p>
                  <p className="break-all font-mono text-sm text-black/70">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function ApiPage() {
  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <InfoPageHeader
        eyebrow="Integration"
        title="API & App Architecture"
        description="CircleSave does not expose a separate public backend REST API. The app is driven by Starknet contracts, StarkZap v2 providers, and wallet-signed on-chain actions."
        accentClassName="bg-[#DDA0DD]"
        actions={
          <>
            <Link to="/swap">
              <Button className="neo-button-primary">Open Swap</Button>
            </Link>
            <Link to="/logs">
              <Button variant="outline" className="border-[2px] border-black font-black">
                View Logs
              </Button>
            </Link>
          </>
        }
      />

      <div className="page-shell grid gap-6 py-8 md:grid-cols-2 md:py-10">
        <div className="border-[3px] border-black bg-white p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="mb-4 inline-flex items-center gap-2 border-[2px] border-black bg-[#FFE66D] px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em]">
            <Network className="h-4 w-4" />
            What Powers The App
          </div>
          <div className="space-y-3 text-[15px] leading-relaxed text-black/70">
            <p>Circle creation, contributions, collateral, and reputation are handled by Starknet smart contracts.</p>
            <p>Swap and DCA flows are powered through StarkZap v2 provider integrations and executed by the user&apos;s connected wallet.</p>
            <p>Logs and dashboard activity are contract-backed views built from public factory, circle, collateral, and reputation events.</p>
          </div>
        </div>

        <div className="border-[3px] border-black bg-white p-6 shadow-[4px_4px_0px_0px_#1a1a1a]">
          <div className="mb-4 inline-flex items-center gap-2 border-[2px] border-black bg-[#4ECDC4] px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-white">
            <ScrollText className="h-4 w-4" />
            Useful Product Routes
          </div>
          <div className="grid gap-3 text-sm font-black uppercase tracking-[0.08em]">
            <Link to="/help" className="border-[2px] border-black bg-[#FEFAE0] px-4 py-3 hover:bg-[#FFE66D]">Help Center</Link>
            <Link to="/circles" className="border-[2px] border-black bg-[#FEFAE0] px-4 py-3 hover:bg-[#FFE66D]">Discover Circles</Link>
            <Link to="/swap" className="border-[2px] border-black bg-[#FEFAE0] px-4 py-3 hover:bg-[#FFE66D]">Swap</Link>
            <Link to="/dca" className="border-[2px] border-black bg-[#FEFAE0] px-4 py-3 hover:bg-[#FFE66D]">DCA</Link>
            <Link to="/lending" className="border-[2px] border-black bg-[#FEFAE0] px-4 py-3 hover:bg-[#FFE66D]">Lending</Link>
            <Link to="/logs" className="border-[2px] border-black bg-[#FEFAE0] px-4 py-3 hover:bg-[#FFE66D]">Logs</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <InfoPageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description="CircleSave is a prototype experience for exploring savings circles and StarkZap-enabled Starknet actions. Use of the app is subject to the limitations described below."
        accentClassName="bg-[#FF6B6B] text-white"
      />
      <div className="page-shell grid gap-6 py-8 md:py-10">
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
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <InfoPageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="CircleSave is designed around wallet-based access and on-chain transparency. This page explains the limited app-level data the interface may surface."
        accentClassName="bg-[#4ECDC4] text-white"
      />
      <div className="page-shell grid gap-6 py-8 md:py-10">
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
      </div>
    </div>
  );
}

export function RiskDisclosurePage() {
  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      <InfoPageHeader
        eyebrow="Legal"
        title="Risk Disclosure"
        description="Using CircleSave involves smart-contract, wallet, liquidity, and testnet risks. Review these points before using swap, DCA, lending, or savings-circle flows."
        accentClassName="bg-[#FFE66D]"
      />
      <div className="page-shell grid gap-6 py-8 md:py-10">
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
      </div>
    </div>
  );
}
