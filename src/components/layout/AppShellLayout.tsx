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

function withAlpha(color: string, alpha: string) {
  return /^#[\da-f]{6}$/i.test(color) ? `${color}${alpha}` : color;
}

const SHELL_ACTIVE_COLOR = '#B5F36B';

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
    <div className="mx-auto flex w-full max-w-[220px] flex-col gap-6">
      <div className="rounded-[20px] border border-black/10 bg-[#f7f2e8] px-3.5 py-4 shadow-[0_24px_48px_-34px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-[#17191d] dark:shadow-[0_24px_48px_-34px_rgba(0,0,0,0.76)]">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            onClick={onNavigate}
            className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-black/10 bg-white/74 text-slate-950 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-white/8 dark:text-white dark:shadow-[0_18px_36px_-24px_rgba(0,0,0,0.7)]"
          >
            <Users className="h-5.5 w-5.5" />
          </Link>
          <div className="min-w-0">
            <p className="inline-flex items-center rounded-[15px] border border-[#9ad255]/35 bg-[#B5F36B] px-3 py-2 font-display text-[1.45rem] font-bold leading-none tracking-[-0.05em] text-slate-950 shadow-[0_18px_38px_-24px_rgba(120,170,43,0.42)]">
              CircleSave
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        {appNavigationSections.map((section, sectionIndex) => (
          <section key={section.title || `section-${sectionIndex}`} className="space-y-2">
            {section.title ? (
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-black/35 dark:text-white/28">
                {section.title}
              </p>
            ) : null}
            <div className="space-y-2">
              {section.items.map((item) => {
                const isActive = isAppRouteActive(pathname, search, item.to);
                const Icon = item.icon;
                const activeSurfaceStyle = isActive
                  ? {
                    borderColor: withAlpha(SHELL_ACTIVE_COLOR, '52'),
                    boxShadow: `0 14px 30px -28px ${withAlpha(SHELL_ACTIVE_COLOR, '70')}`,
                  }
                  : undefined;
                const activeIconStyle = isActive
                  ? {
                    backgroundColor: 'rgba(255,255,255,0.76)',
                    borderColor: 'rgba(15, 23, 42, 0.1)',
                    color: '#0f172a',
                    boxShadow: `0 14px 28px -22px ${withAlpha(SHELL_ACTIVE_COLOR, '88')}`,
                  }
                  : undefined;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      'group flex items-center gap-4 rounded-[16px] border px-3.5 py-3 transition duration-200',
                      isActive
                        ? 'bg-transparent text-foreground dark:text-white'
                        : 'border-transparent bg-transparent text-black/62 hover:border-black/10 hover:bg-black/[0.04] hover:text-foreground dark:text-white/72 dark:hover:border-white/10 dark:hover:bg-white/6 dark:hover:text-white',
                    )}
                    style={activeSurfaceStyle}
                  >
                    <div
                      className={cn(
                        'flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[13px] border',
                        isActive
                          ? ''
                          : 'border-black/8 bg-white/46 group-hover:border-black/10 group-hover:bg-white/78 dark:border-white/8 dark:bg-white/[0.03] dark:group-hover:border-white/10 dark:group-hover:bg-white/8',
                      )}
                      style={isActive ? activeIconStyle : undefined}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[17.5px] font-semibold tracking-[-0.015em]">{item.label}</p>
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
  const pageAccent = SHELL_ACTIVE_COLOR;
  const toolbarButtonClass = 'flex h-9 w-9 items-center justify-center rounded-[16px] border border-black/10 text-foreground shadow-[0_16px_36px_-24px_rgba(15,23,42,0.22)] transition duration-200 hover:-translate-y-0.5 dark:border-white/10 dark:shadow-[0_18px_40px_-26px_rgba(0,0,0,0.76)]';
  const toolbarButtonStyle = { background: 'var(--surface-panel-soft)' };
  const walletChipStyle = {
    backgroundColor: 'rgb(181 243 107 / var(--tw-bg-opacity, 1))',
    backgroundImage: 'none',
    borderColor: 'rgba(154, 210, 85, 0.35)',
    boxShadow: isDark
      ? '0 20px 42px -28px rgba(78, 110, 24, 0.56)'
      : '0 18px 38px -26px rgba(120, 170, 43, 0.32)',
  };

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
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55 underline underline-offset-4 transition hover:text-white/80"
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
        className={toolbarButtonClass}
        style={toolbarButtonStyle}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      >
        {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(toolbarButtonClass, 'relative')}
            style={notificationCount > 0
              ? {
                backgroundColor: '#FFB457',
                borderColor: 'rgba(224, 153, 56, 0.42)',
                color: '#0f172a',
                boxShadow: '0 18px 38px -24px rgba(223,147,35,0.42)',
              }
              : toolbarButtonStyle}
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
          className="w-[min(92vw,26rem)] rounded-[26px] border border-white/10 bg-[#0b1016] p-3 text-white shadow-[0_34px_82px_-42px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
        >
          <div className="mb-3 flex items-start justify-between gap-3 px-2 pt-1">
            <div>
              <DropdownMenuLabel className="px-0 font-display text-lg font-semibold tracking-[-0.03em] text-white">
                Notifications
              </DropdownMenuLabel>
              <p className="text-sm leading-6 text-white/62">
                Creator approvals, member joins, and circles ready to launch.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55 underline underline-offset-4 transition hover:text-white/80"
            >
              Open dashboard
            </Link>
          </div>

          {!isConnected ? (
            <div className="rounded-[22px] border border-white/10 bg-white/4 px-4 py-5 text-sm leading-6 text-white/62">
              Connect a wallet to see creator notifications.
            </div>
          ) : notificationsLoading ? (
            <div className="rounded-[22px] border border-white/10 bg-white/4 px-4 py-5 text-sm leading-6 text-white/62">
              Syncing your latest notifications...
            </div>
          ) : (
            <div className="space-y-3">
              {notificationSections.map((section, index) => (
                <div key={section.key}>
                  {index > 0 && <DropdownMenuSeparator className="my-3 bg-white/10" />}
                  <div className="mb-2 flex items-center justify-between gap-3 px-2">
                    <div>
                      <p className="text-[13px] font-semibold text-white">{section.title}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-white/48">
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
                          className="flex items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/4 px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:bg-white/8"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                            <p className="truncate text-xs uppercase tracking-[0.14em] text-white/52">
                              {item.detail}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-white/36" />
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-sm leading-6 text-white/52">
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
          <div
            className="hidden min-w-[188px] items-center justify-center gap-2 rounded-[15px] border px-3 py-2 text-sm font-semibold text-slate-950 sm:inline-flex"
            style={walletChipStyle}
          >
            <span className="max-w-[88px] truncate text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-900/72">
              {formatAddress(address || '')}
            </span>
            <CopyButton
              value={address || ''}
              successMessage="Wallet address copied"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-full border border-black/10 bg-white/55 text-slate-950 hover:bg-white/78"
            />
            <span className="h-4 w-px bg-black/10" />
            <span className="truncate">{balanceLabel}</span>
          </div>
          <Button
            variant="default"
            size="icon"
            onClick={() => navigate('/profile')}
            aria-label={`Connected wallet ${formatAddress(address || '')} ${balanceLabel}`}
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
      <div className="h-screen overflow-hidden bg-background dark:bg-[#05070c]">
        <div className="mx-auto flex h-full w-full max-w-[1480px] gap-0 px-0 py-0 lg:gap-4 lg:px-5 lg:py-4">
          <aside className="hidden w-[248px] shrink-0 lg:flex lg:items-start">
            <div className="w-full overflow-hidden rounded-[26px] border border-black/8 bg-white/72 px-3.5 py-4.5 text-foreground shadow-[0_28px_84px_-38px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-white/8 dark:bg-[#05070c] dark:text-white dark:shadow-[0_28px_84px_-38px_rgba(0,0,0,0.9)]">
              <SidebarContent
                pathname={location.pathname}
                search={location.search}
              />
            </div>
          </aside>

          <div className="workspace-stage flex min-w-0 flex-1 flex-col gap-3 overflow-hidden dark:bg-[#05070c]">
            <header className="z-20 px-3 pt-3 lg:px-0 lg:pt-0">
              <div
                className="flex items-center justify-between gap-3 rounded-[18px] border border-black/10 px-2.5 py-1.5 shadow-[0_16px_38px_-28px_rgba(15,23,42,0.18)] dark:border-white/10 dark:shadow-[0_18px_42px_-30px_rgba(0,0,0,0.76)]"
                style={{ background: 'var(--surface-panel)' }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className={cn(toolbarButtonClass, 'h-8.5 w-8.5 lg:hidden')}
                    style={toolbarButtonStyle}
                    aria-label="Open workspace menu"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>

                  <div
                    className="min-w-0 rounded-[15px] border px-3.5 py-1.5 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.2)]"
                    style={{
                      backgroundColor: pageAccent,
                      borderColor: withAlpha(pageAccent, '5a'),
                    }}
                  >
                    <h1 className="truncate font-display text-[1rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[1.12rem]">
                      {pageMeta.title}
                    </h1>
                  </div>
                </div>

                {headerControls}
              </div>
            </header>

            <main className="scrollbar-hidden min-w-0 flex-1 overflow-y-auto bg-transparent px-3 pb-3 dark:bg-[#05070c] lg:px-0 lg:pb-0">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[min(90vw,22.75rem)] border-r border-black/10 bg-white/96 px-0 text-foreground [&>button]:hidden dark:border-white/10 dark:bg-[#05070c] dark:text-white"
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
