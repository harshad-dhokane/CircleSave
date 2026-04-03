import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { useApproveMember, useIncomingCircleRequests, useRejectMember } from '@/hooks/useCircle';
import { CircleMemberJoinPanel } from '@/components/circles/CircleMemberJoinPanel';
import { CircleRequestsPanel } from '@/components/circles/CircleRequestsPanel';
import { Button } from '@/components/ui/button';
import { Wallet, Menu, X, Users, TrendingUp, ArrowRightLeft, Repeat, PiggyBank, BookOpen, Moon, Sun, AlertTriangle, FileText, ChevronDown, Blocks, BellRing, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { formatAddress } from '@/lib/constants';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const navItems = [
  { href: '/', label: 'Home', icon: null },
  { href: '/circles', label: 'Discover', icon: Users },
  { href: '/logs', label: 'Logs', icon: FileText },
  { href: '/dashboard', label: 'Dashboard', icon: TrendingUp },
  { href: '/help', label: 'Help', icon: BookOpen },
];

const sdkItems = [
  { href: '/swap', label: 'Swap', description: 'Preview and execute routes from the shared wallet.', icon: ArrowRightLeft },
  { href: '/batching', label: 'Batching', description: 'Sign one TxBuilder transaction with multiple transfers.', icon: Blocks },
  { href: '/dca', label: 'DCA', description: 'Create recurring buy orders from the same session.', icon: Repeat },
  { href: '/lending', label: 'Lend', description: 'Deposit and withdraw through Vesu.', icon: PiggyBank },
  // Staking disabled — no live Sepolia pools
  // { href: '/staking', label: 'Stake', description: 'Delegate STRK to a staking pool and earn rewards.', icon: Landmark },
] as const;

function isNavItemActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isSdkItemActive(pathname: string) {
  return sdkItems.some((item) => isNavItemActive(pathname, item.href));
}

export function Header() {
  const {
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    walletOptions,
    balance,
    balanceLoading,
    walletNotice,
  } = useWallet();
  const {
    requests,
    memberJoinNotices,
    pendingCount: pendingRequestCount,
    memberJoinCount,
    readyToStartCircles,
    readyToStartCount,
    notificationCount,
    isLoading: requestsLoading,
    markMemberJoinNoticesSeen,
    refetch: refetchRequests,
  } = useIncomingCircleRequests({ pollMs: 30000 });
  const { approveMember, isSubmitting: approvingRequest } = useApproveMember();
  const { rejectMember, isSubmitting: rejectingRequest } = useRejectMember();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [actingRequestAction, setActingRequestAction] = useState<'approve' | 'reject' | null>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  const isDark = resolvedTheme !== 'light';
  const balanceLabel = balanceLoading
    ? '...'
    : balance
      ? `${parseFloat(balance.formatted).toFixed(2)} ${balance.symbol}`
      : walletNotice
        ? 'Syncing...'
        : '0.00 STRK';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleApproveRequest = async (request: (typeof requests)[number]) => {
    setActingRequestId(request.id);
    setActingRequestAction('approve');
    try {
      const outcome = await approveMember(request.circleAddress, request.applicantAddress);

      if (!outcome.ok) {
        toast.error(outcome.error);
        return;
      }

      toast.success('Join request approved');
      await refetchRequests();
    } finally {
      setActingRequestId(null);
      setActingRequestAction(null);
    }
  };

  const handleRejectRequest = async (request: (typeof requests)[number]) => {
    setActingRequestId(request.id);
    setActingRequestAction('reject');
    try {
      const outcome = await rejectMember(request.circleAddress, request.applicantAddress);

      if (!outcome.ok) {
        toast.error(outcome.error);
        return;
      }

      toast.success('Join request rejected');
      await refetchRequests();
    } finally {
      setActingRequestId(null);
      setActingRequestAction(null);
    }
  };

  const leadingNavItems = navItems.slice(0, 2);
  const trailingNavItems = navItems.slice(2);
  const desktopNavItemClass = 'inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-none border-[2px] px-4 text-[13px] font-black uppercase tracking-[0.03em] transition-all';
  const desktopNavActiveClass = 'border-black bg-black text-white shadow-[2px_2px_0px_0px_#1a1a1a]';
  const desktopNavIdleClass = 'border-transparent hover:border-black hover:shadow-[1px_1px_0px_0px_#1a1a1a]';
  const walletPillClass = 'h-11 border-[2px] border-black px-3.5 shadow-[1px_1px_0px_0px_#1a1a1a]';

  return (
    <header className="content-divider-bottom fixed inset-x-0 top-0 z-50 border-b-[2px] border-black bg-[#FEFAE0]/95 backdrop-blur-sm">
      <div className="page-shell">
        <div className="flex min-h-[4.65rem] items-center justify-between gap-2 py-2.5 sm:gap-3">
          {/* Logo */}
          <Link to="/" className="group flex min-w-0 items-center gap-2 sm:gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center border-[2px] border-black bg-[#FF6B6B] transition-all group-hover:shadow-[3px_3px_0px_0px_#1a1a1a]">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="truncate text-[1.1rem] font-black tracking-tight min-[360px]:text-[1.2rem] sm:text-[1.65rem]">
              Circle<span className="text-[#FF6B6B]">Save</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {leadingNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`${desktopNavItemClass}
                  ${isNavItemActive(location.pathname, item.href)
                    ? desktopNavActiveClass
                    : desktopNavIdleClass
                  }`}
              >
                {item.label}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`${desktopNavItemClass}
                    ${isSdkItemActive(location.pathname)
                      ? desktopNavActiveClass
                      : desktopNavIdleClass
                    }`}
                >
                  SDK
                  <ChevronDown className="ml-2 h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-72 rounded-none border-[2px] border-black bg-[#FEFAE0] p-2 shadow-[4px_4px_0px_0px_#1a1a1a]"
              >
                <DropdownMenuLabel className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-black/55">
                  StarkZap Workspace
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-black/15" />
                {sdkItems.map((item, index) => (
                  <DropdownMenuItem
                    key={item.href}
                    asChild
                    className={`rounded-none px-0 py-0 focus:bg-transparent ${index > 0 ? 'mt-1' : 'mt-0'}`}
                  >
                    <Link
                      to={item.href}
                      className={`flex items-start gap-3 border-[2px] px-3 py-3 ${
                        isNavItemActive(location.pathname, item.href) ? 'border-black bg-white' : 'border-transparent bg-transparent hover:border-black hover:bg-white'
                      }`}
                    >
                      <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-black uppercase tracking-[0.04em]">{item.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-black/60">{item.description}</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {trailingNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`${desktopNavItemClass}
                  ${isNavItemActive(location.pathname, item.href)
                    ? desktopNavActiveClass
                    : desktopNavIdleClass
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Wallet Connection */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
              className="hidden h-11 w-11 shrink-0 items-center justify-center border-[2px] border-black bg-white shadow-[1px_1px_0px_0px_#1a1a1a] transition-all hover:shadow-[3px_3px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 lg:flex"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className={`hidden md:flex items-center gap-2 bg-white ${walletPillClass}`}>
                  <Wallet className="w-4 h-4 text-[#4ECDC4]" />
                  <span className="font-bold text-[14px] whitespace-nowrap">{balanceLabel}</span>
                </div>
                <div className={`hidden sm:flex items-center gap-2 bg-[#FFE66D] ${walletPillClass}`}>
                  <Users className="w-4 h-4" />
                  <span className="font-bold text-[14px] whitespace-nowrap">{formatAddress(address!)}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="relative flex h-11 w-11 shrink-0 items-center justify-center border-[2px] border-black bg-white shadow-[1px_1px_0px_0px_#1a1a1a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1a1a1a]"
                      aria-label="Open creator notifications"
                    >
                      <BellRing className="h-4 w-4" />
                      {notificationCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full border-[2px] border-black bg-[#FF6B6B] px-1 text-[11px] font-black text-white">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[min(92vw,26rem)] rounded-[26px] border border-black/10 bg-white/92 p-3 text-foreground shadow-[0_26px_72px_-40px_rgba(15,23,42,0.6)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0d111a]/92 dark:shadow-[0_34px_82px_-42px_rgba(0,0,0,0.9)]"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-muted-foreground">Creator Inbox</p>
                        <h3 className="text-lg font-black text-foreground">Notifications</h3>
                      </div>
                      <Link
                        to="/dashboard?tab=requests"
                        className="text-xs font-black uppercase tracking-[0.08em] underline underline-offset-4"
                      >
                        Open Dashboard
                      </Link>
                    </div>

                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-muted-foreground">Member Joins</p>
                        <h4 className="text-base font-black text-foreground">Managed Circles</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {memberJoinCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markMemberJoinNoticesSeen()}
                            className="text-[11px] font-black uppercase tracking-[0.08em] underline underline-offset-4"
                          >
                            Mark Seen
                          </button>
                        )}
                        <span className="rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] dark:border-white/10 dark:bg-white/5">
                          {memberJoinCount}
                        </span>
                      </div>
                    </div>

                    <CircleMemberJoinPanel
                      notices={memberJoinNotices.slice(0, 3)}
                      isLoading={requestsLoading}
                      compact
                      className="mb-4 max-h-[22rem] overflow-y-auto pr-1"
                      emptyDescription="New members joining your managed circles will show up here."
                    />

                    {readyToStartCircles.length > 0 && (
                      <div className="mb-4 rounded-[22px] border border-[#B5F36B]/24 bg-[#B5F36B]/14 p-3 dark:border-[#B5F36B]/18 dark:bg-[#B5F36B]/10">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.08em] text-muted-foreground">Ready To Start</p>
                              <h4 className="text-base font-black text-foreground">Filled Circles</h4>
                            </div>
                          </div>
                          <span className="rounded-full border border-black/10 bg-white/72 px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] dark:border-white/10 dark:bg-white/8">
                            {readyToStartCount}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {readyToStartCircles.slice(0, 3).map((circle) => (
                            <Link
                              key={circle.id}
                              to={`/circles/${circle.circleId}`}
                              className="flex items-center justify-between gap-3 rounded-[20px] border border-black/10 bg-black/[0.03] px-3 py-3 transition duration-200 hover:-translate-y-0.5 hover:bg-black/[0.045] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-black text-foreground">{circle.circleName}</p>
                                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                                  {circle.currentMembers}/{circle.maxMembers} members filled
                                </p>
                              </div>
                              <span className="shrink-0 text-xs font-black uppercase tracking-[0.08em] underline underline-offset-4">
                                Open
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-muted-foreground">Join Requests</p>
                        <h4 className="text-base font-black text-foreground">Approval Queue</h4>
                      </div>
                      <span className="rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] dark:border-white/10 dark:bg-white/5">
                        {pendingRequestCount}
                      </span>
                    </div>

                    <CircleRequestsPanel
                      requests={requests.slice(0, 4)}
                      isLoading={requestsLoading}
                      actingRequestId={actingRequestId}
                      actingRequestAction={actingRequestAction}
                      onApprove={handleApproveRequest}
                      onReject={handleRejectRequest}
                      compact
                      className="max-h-[26rem] overflow-y-auto pr-1"
                      emptyDescription={readyToStartCount > 0
                        ? 'Filled circles are ready to start above. New applicants for approval-required circles will appear here.'
                        : 'Approval-required circles you create will surface new applicants here.'}
                    />

                    {(approvingRequest || rejectingRequest) && (
                      <p className="mt-3 text-xs font-black uppercase tracking-[0.08em] text-muted-foreground">
                        Updating request status...
                      </p>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  className="h-11 shrink-0 border-[2px] border-black px-3 text-[13px] shadow-[1px_1px_0px_0px_#1a1a1a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1a1a1a] sm:px-4 sm:text-[14px] font-bold"
                >
                  <span className="sm:hidden">Wallet</span>
                  <span className="hidden sm:inline">Disconnect</span>
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => setWalletDialogOpen(true)}
                  disabled={isConnecting}
                  className="h-11 shrink-0 border-[2px] border-black bg-[#FF6B6B] px-3 text-[13px] font-black text-white shadow-[1px_1px_0px_0px_#1a1a1a] transition-all hover:bg-[#ff6262] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1a1a1a] sm:px-4 sm:text-[14px]"
                >
                  <Wallet className="mr-1.5 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
                  <span className="sm:hidden">
                    {isConnecting ? 'Connecting' : 'Connect'}
                  </span>
                  <span className="hidden sm:inline">
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </span>
                </Button>
                <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
                  <DialogContent className="overflow-hidden rounded-[28px] border border-black/10 bg-white/92 p-0 shadow-[0_32px_80px_-38px_rgba(15,23,42,0.48)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b0f15] dark:shadow-[0_34px_90px_-40px_rgba(0,0,0,0.92)] sm:max-w-[560px]">
                    <div className="border-b border-black/8 px-6 py-5 dark:border-white/10">
                      <DialogHeader>
                        <DialogTitle className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                          Connect wallet
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-6 text-muted-foreground">
                          Use Cartridge social login to explore circles, swap, automate DCA, and fund positions without wallet-mode glitches.
                        </DialogDescription>
                      </DialogHeader>
                    </div>
                    <div className="grid gap-3 px-6 py-6">
                      {walletOptions.map((option) => (
                        <Button
                          key={option.id}
                          onClick={async () => {
                            await connectWallet(option.id);
                            setWalletDialogOpen(false);
                          }}
                          disabled={isConnecting || !option.installed}
                          variant="outline"
                          className="justify-between rounded-[22px] border border-black/10 bg-black/[0.03] px-5 py-6 text-left text-[15px] font-semibold text-foreground shadow-none hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8 disabled:opacity-50"
                        >
                          <span>{option.name}</span>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            {option.id === 'controller' ? 'Social Login' : option.installed ? 'Installed' : 'Not Installed'}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 w-11 shrink-0 items-center justify-center border-[2px] border-black bg-white shadow-[1px_1px_0px_0px_#1a1a1a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1a1a1a] lg:hidden"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="py-4 border-t-[2px] border-black lg:hidden">
            <div className="flex flex-col gap-2">
              {leadingNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 font-bold text-[15px] border-[2px] transition-all
                    ${isNavItemActive(location.pathname, item.href)
                      ? 'bg-black text-white border-black' 
                      : 'bg-white border-black shadow-[1px_1px_0px_0px_#1a1a1a]'
                    }`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-2 border-[2px] border-black bg-white p-3 shadow-[1px_1px_0px_0px_#1a1a1a]">
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <p className="text-[13px] font-black uppercase tracking-[0.08em]">SDK Workspace</p>
                </div>
                <div className="flex flex-col gap-2">
                  {sdkItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 text-[14px] font-bold border-[2px] transition-all ${
                        isNavItemActive(location.pathname, item.href)
                          ? 'bg-black text-white border-black'
                          : 'bg-[#FEFAE0] border-black'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {trailingNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 font-bold text-[15px] border-[2px] transition-all
                    ${isNavItemActive(location.pathname, item.href)
                      ? 'bg-black text-white border-black'
                      : 'bg-white border-black shadow-[1px_1px_0px_0px_#1a1a1a]'
                    }`}
                >
                  {item.label}
                </Link>
              ))}

              {isConnected && (
                <Link
                  to="/dashboard?tab=requests"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between gap-3 px-4 py-3 font-bold text-[15px] border-[2px] border-black bg-white shadow-[1px_1px_0px_0px_#1a1a1a]"
                >
                  <span className="flex items-center gap-3">
                    <BellRing className="h-4 w-4" />
                    Creator Inbox
                  </span>
                  {notificationCount > 0 && (
                    <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full border-[2px] border-black bg-[#FF6B6B] px-1 text-[11px] font-black text-white">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Link>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                className="mt-2 flex items-center gap-3 border-[2px] border-black bg-white px-4 py-3 text-left font-bold text-[15px] shadow-[1px_1px_0px_0px_#1a1a1a] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1a1a1a]"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? 'Switch To Light Mode' : 'Switch To Dark Mode'}
              </button>

              {isConnected && (
                <div className="mt-2 flex items-center justify-between border-[2px] border-black bg-white px-4 py-3 shadow-[1px_1px_0px_0px_#1a1a1a]">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-[#4ECDC4]" />
                    <span className="text-[13px] font-black uppercase tracking-[0.08em]">Wallet Balance</span>
                  </div>
                  <span className="font-bold text-[14px]">{balanceLabel}</span>
                </div>
              )}
            </div>
          </nav>
        )}

        {isConnected && walletNotice && (
          <div className="pb-3">
            <div className="flex items-start gap-3 border-[2px] border-black bg-[#FFE66D] px-4 py-3 shadow-[2px_2px_0px_0px_#1a1a1a]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] font-black uppercase tracking-[0.08em]">{walletNotice.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-black/70">{walletNotice.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
