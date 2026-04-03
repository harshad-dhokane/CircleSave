import { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BellRing,
  ChevronRight,
  LogOut,
  Moon,
  PanelLeft,
  SunMedium,
  Users,
  Wallet,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useIncomingCircleRequests } from '@/hooks/useCircle';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress } from '@/lib/constants';
import { appNavigationSections, getPageMeta, isAppRouteActive } from '@/lib/navigation';
import { getCirclePath } from '@/lib/routes';
import { ConnectWalletDialog } from '@/components/layout/ConnectWalletDialog';

function SidebarContent({
  pathname,
  search,
  onNavigate,
}: {
  pathname: string;
  search: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[204px] flex-col gap-6">
      <div className="rounded-[20px] border border-black/10 bg-[linear-gradient(145deg,rgba(181,243,107,0.18),rgba(124,200,255,0.12)_48%,rgba(255,180,87,0.12))] px-3.5 py-4 shadow-[0_24px_48px_-34px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(181,243,107,0.12),rgba(124,200,255,0.08)_48%,rgba(255,180,87,0.08))] dark:shadow-[0_24px_48px_-34px_rgba(0,0,0,0.76)]">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            onClick={onNavigate}
            className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-black/10 bg-white/74 text-slate-950 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-white/8 dark:text-white dark:shadow-[0_18px_36px_-24px_rgba(0,0,0,0.7)]"
          >
            <Users className="h-5.5 w-5.5" />
          </Link>
          <div className="min-w-0">
            <p className="bg-[linear-gradient(120deg,#B5F36B_0%,#7CC8FF_52%,#FFB457_100%)] bg-clip-text font-display text-[1.45rem] font-bold leading-none tracking-[-0.05em] text-transparent">
              CircleSave
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        {appNavigationSections.map((section, sectionIndex) => (
          <section key={section.title || `section-${sectionIndex}`} className="space-y-2">
            {section.title ? (
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/35 dark:text-white/28">
                {section.title}
              </p>
            ) : null}
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const isActive = isAppRouteActive(pathname, search, item.to);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      'group flex items-center gap-3.5 rounded-[15px] border px-3 py-2.5 transition duration-200',
                      isActive
                        ? 'border-black/10 bg-black/[0.05] text-foreground shadow-[0_18px_40px_-26px_rgba(15,23,42,0.18)] dark:border-white/12 dark:bg-white/10 dark:text-white dark:shadow-[0_18px_40px_-26px_rgba(0,0,0,0.8)]'
                        : 'border-transparent bg-transparent text-black/62 hover:border-black/10 hover:bg-black/[0.04] hover:text-foreground dark:text-white/72 dark:hover:border-white/10 dark:hover:bg-white/6 dark:hover:text-white',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[12px] border',
                        isActive
                          ? 'border-black/10 bg-white/76 dark:border-white/10 dark:bg-white/10'
                          : 'border-black/8 bg-white/46 group-hover:border-black/10 group-hover:bg-white/78 dark:border-white/8 dark:bg-white/[0.03] dark:group-hover:border-white/10 dark:group-hover:bg-white/8',
                      )}
                      style={isActive ? { color: item.accent } : undefined}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[16.5px] font-semibold tracking-[-0.015em]">{item.label}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function AppShellLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const {
    address,
    isConnected,
    isConnecting,
    disconnectWallet,
    balance,
    balanceLoading,
  } = useWallet();
  const {
    requests,
    memberJoinNotices,
    readyToStartCircles,
    pendingCount,
    memberJoinCount,
    readyToStartCount,
    notificationCount,
    isLoading: notificationsLoading,
    markMemberJoinNoticesSeen,
  } = useIncomingCircleRequests({ pollMs: 30000 });

  const balanceLabel = balanceLoading
    ? 'Syncing'
    : balance
      ? `${parseFloat(balance.formatted).toFixed(2)} ${balance.symbol}`
      : '0.00 STRK';
  const isDark = resolvedTheme !== 'light';
  const pageMeta = useMemo(
    () => getPageMeta(location.pathname, location.search),
    [location.pathname, location.search],
  );

  const notificationSections = useMemo(() => [
    {
      key: 'ready',
      title: 'Ready To Start',
      count: readyToStartCount,
      action:
        readyToStartCount > 0
          ? (
            <span className="rounded-full border border-black/10 bg-[#B5F36B]/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/65 dark:border-white/10 dark:text-white/65">
              {readyToStartCount}
            </span>
          )
          : null,
      items: readyToStartCircles.slice(0, 3).map((circle) => ({
        id: circle.id,
        to: getCirclePath(circle.circleId),
        title: circle.circleName,
        detail: `${circle.currentMembers}/${circle.maxMembers} members joined`,
      })),
      empty: 'Filled circles will appear here once they are ready to launch.',
    },
    {
      key: 'requests',
      title: 'Approval Queue',
      count: pendingCount,
      action:
        pendingCount > 0
          ? (
            <span className="rounded-full border border-black/10 bg-[#FFB457]/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/65 dark:border-white/10 dark:text-white/65">
              {pendingCount}
            </span>
          )
          : null,
      items: requests.slice(0, 3).map((request) => ({
        id: request.id,
        to: getCirclePath(request.circleId),
        title: request.circleName,
        detail: `Request from ${formatAddress(request.applicantAddress)}`,
      })),
      empty: 'Approval-required circles you manage will surface new applicants here.',
    },
    {
      key: 'joins',
      title: 'Member Joins',
      count: memberJoinCount,
      action:
        memberJoinCount > 0
          ? (
            <button
              type="button"
              onClick={() => markMemberJoinNoticesSeen()}
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/55 underline underline-offset-4 dark:text-white/55"
            >
              Mark seen
            </button>
          )
          : null,
      items: memberJoinNotices.slice(0, 3).map((notice) => ({
        id: notice.id,
        to: getCirclePath(notice.circleId),
        title: notice.circleName,
        detail: `${formatAddress(notice.memberAddress)} joined`,
      })),
      empty: 'Open circles will show newly joined members here.',
    },
  ], [
    markMemberJoinNoticesSeen,
    memberJoinCount,
    memberJoinNotices,
    pendingCount,
    readyToStartCircles,
    readyToStartCount,
    requests,
  ]);

  const headerControls = (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="flex h-9 w-9 items-center justify-center rounded-[16px] border border-black/10 bg-white/80 text-foreground shadow-[0_16px_36px_-24px_rgba(15,23,42,0.32)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_40px_-26px_rgba(0,0,0,0.82)] dark:hover:bg-white/[0.07]"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      >
        {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-[16px] border border-black/10 bg-white/80 text-foreground shadow-[0_16px_36px_-24px_rgba(15,23,42,0.32)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_40px_-26px_rgba(0,0,0,0.82)]"
            aria-label="Open notifications"
          >
            <BellRing className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -right-1.5 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#FF6B6B] px-1 text-[10px] font-semibold text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[min(92vw,26rem)] rounded-[26px] border border-black/10 bg-white/92 p-3 shadow-[0_26px_72px_-40px_rgba(15,23,42,0.6)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0d111a]/92 dark:shadow-[0_34px_82px_-42px_rgba(0,0,0,0.9)]"
        >
          <div className="mb-3 flex items-start justify-between gap-3 px-2 pt-1">
            <div>
              <DropdownMenuLabel className="px-0 font-display text-lg font-semibold tracking-[-0.03em] text-foreground">
                Notifications
              </DropdownMenuLabel>
              <p className="text-sm leading-6 text-muted-foreground">
                Creator approvals, member joins, and circles ready to launch.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/55 underline underline-offset-4 dark:text-white/55"
            >
              Open dashboard
            </Link>
          </div>

          {!isConnected ? (
            <div className="rounded-[22px] border border-black/10 bg-black/[0.02] px-4 py-5 text-sm leading-6 text-muted-foreground dark:border-white/10 dark:bg-white/4">
              Connect a wallet to see creator notifications.
            </div>
          ) : notificationsLoading ? (
            <div className="rounded-[22px] border border-black/10 bg-black/[0.02] px-4 py-5 text-sm leading-6 text-muted-foreground dark:border-white/10 dark:bg-white/4">
              Syncing your latest notifications...
            </div>
          ) : (
            <div className="space-y-3">
              {notificationSections.map((section, index) => (
                <div key={section.key}>
                  {index > 0 && <DropdownMenuSeparator className="my-3 bg-black/8 dark:bg-white/10" />}
                  <div className="mb-2 flex items-center justify-between gap-3 px-2">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{section.title}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {section.count} open
                      </p>
                    </div>
                    {section.action}
                  </div>
                  <div className="space-y-2">
                    {section.items.length > 0 ? (
                      section.items.map((item) => (
                        <Link
                          key={item.id}
                          to={item.to}
                          className="flex items-center justify-between gap-3 rounded-[20px] border border-black/10 bg-black/[0.02] px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:bg-black/[0.045] dark:border-white/10 dark:bg-white/4 dark:hover:bg-white/7"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="truncate text-xs uppercase tracking-[0.14em] text-muted-foreground">
                              {item.detail}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-[20px] border border-dashed border-black/10 px-4 py-4 text-sm leading-6 text-muted-foreground dark:border-white/10">
                        {section.empty}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isConnected ? (
        <>
          <div className="hidden min-w-[188px] items-center justify-center gap-2 rounded-[15px] border border-[#B5F36B]/16 bg-[linear-gradient(135deg,rgba(181,243,107,0.24),rgba(124,200,255,0.18))] px-3 py-2 text-sm font-semibold text-slate-950 shadow-[0_18px_38px_-26px_rgba(65,92,20,0.34)] backdrop-blur-xl dark:border-[#B5F36B]/20 dark:bg-[linear-gradient(135deg,rgba(181,243,107,0.2),rgba(124,200,255,0.12))] dark:text-white dark:shadow-[0_20px_42px_-28px_rgba(26,54,86,0.72)] sm:inline-flex">
            <span className="max-w-[88px] truncate text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-900/72 dark:text-white/88">
              {formatAddress(address || '')}
            </span>
            <CopyButton
              value={address || ''}
              successMessage="Wallet address copied"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-full border border-black/10 bg-white/45 text-slate-950 hover:bg-white/72 dark:border-white/10 dark:bg-black/10 dark:text-white dark:hover:bg-white/12"
            />
            <span className="h-4 w-px bg-black/10 dark:bg-white/12" />
            <span className="truncate">{balanceLabel}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/profile')}
            aria-label={`Connected wallet ${formatAddress(address || '')} ${balanceLabel}`}
            className="border-[#B5F36B]/20 bg-[linear-gradient(135deg,rgba(181,243,107,0.22),rgba(124,200,255,0.14))] text-slate-950 shadow-[0_18px_38px_-24px_rgba(58,89,22,0.34)] hover:bg-[linear-gradient(135deg,rgba(181,243,107,0.3),rgba(124,200,255,0.2))] dark:text-white dark:shadow-[0_18px_38px_-24px_rgba(58,89,22,0.5)]"
          >
            <Wallet className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={disconnectWallet}
            aria-label="Disconnect wallet"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Button
          onClick={() => setWalletDialogOpen(true)}
          disabled={isConnecting}
          size="icon"
          aria-label={isConnecting ? 'Connecting wallet' : 'Connect wallet'}
          className="shadow-[0_18px_40px_-24px_rgba(66,103,140,0.6)]"
        >
          <Wallet className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="h-screen overflow-hidden bg-background">
        <div className="mx-auto flex h-full w-full max-w-[1480px] gap-4 px-3 py-3 sm:px-4 lg:px-5 lg:py-4">
          <aside className="hidden w-[236px] shrink-0 lg:flex lg:items-start">
            <div className="w-full overflow-hidden rounded-[26px] border border-black/8 bg-white/72 px-3 py-4 text-foreground shadow-[0_28px_84px_-38px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-white/8 dark:bg-[#05070c] dark:text-white dark:shadow-[0_28px_84px_-38px_rgba(0,0,0,0.9)]">
              <SidebarContent
                pathname={location.pathname}
                search={location.search}
              />
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden">
            <header className="z-20 px-0.5 py-0.5">
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-black/10 bg-white/44 px-2.5 py-1.5 shadow-[0_16px_38px_-28px_rgba(15,23,42,0.2)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.02] dark:shadow-[0_18px_42px_-30px_rgba(0,0,0,0.82)]">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[15px] border border-black/10 bg-white/74 text-foreground shadow-[0_16px_36px_-24px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_40px_-26px_rgba(0,0,0,0.82)] lg:hidden"
                    aria-label="Open workspace menu"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>

                  <div className="min-w-0 rounded-[14px] border border-black/8 bg-black/[0.02] px-3 py-1 dark:border-white/10 dark:bg-white/[0.03]">
                    <h1 className="truncate font-display text-[1rem] font-semibold tracking-[-0.04em] text-foreground sm:text-[1.12rem]">
                      {pageMeta.title}
                    </h1>
                  </div>
                </div>

                {headerControls}
              </div>
            </header>

            <main className="scrollbar-hidden min-w-0 flex-1 overflow-y-auto pr-1">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[min(90vw,22rem)] border-r border-black/10 bg-white/96 px-0 text-foreground [&>button]:hidden dark:border-white/10 dark:bg-[#05070c] dark:text-white"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Workspace navigation</SheetTitle>
            <SheetDescription>Browse dashboard sections and product tools.</SheetDescription>
          </SheetHeader>
          <div className="h-full min-h-0 px-4 py-5">
            <SidebarContent
              pathname={location.pathname}
              search={location.search}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ConnectWalletDialog
        open={walletDialogOpen}
        onOpenChange={setWalletDialogOpen}
      />
    </>
  );
}
