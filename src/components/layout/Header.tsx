import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Wallet, Menu, X, Users, TrendingUp, ArrowRightLeft, Repeat, PiggyBank, BookOpen, Moon, Sun, AlertTriangle, FileText, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
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

const navItems = [
  { href: '/', label: 'Home', icon: null },
  { href: '/circles', label: 'Discover', icon: Users },
  { href: '/logs', label: 'Logs', icon: FileText },
  { href: '/dashboard', label: 'Dashboard', icon: TrendingUp },
  { href: '/sdk', label: 'Help', icon: BookOpen },
];

const sdkItems = [
  { href: '/swap', label: 'Swap', description: 'Preview and execute routes from the shared wallet.', icon: ArrowRightLeft },
  { href: '/dca', label: 'DCA', description: 'Create recurring buy orders from the same session.', icon: Repeat },
  { href: '/lending', label: 'Lend', description: 'Deposit and withdraw through Vesu.', icon: PiggyBank },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const balanceLabel = balanceLoading
    ? '...'
    : balance
      ? `${parseFloat(balance.formatted).toFixed(2)} ${balance.symbol}`
      : walletNotice
        ? 'Syncing...'
        : '0.00 STRK';

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
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
                  <DialogContent className="border-[2px] border-black bg-[#FEFAE0] shadow-[4px_4px_0px_0px_#1a1a1a]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black">Connect Wallet</DialogTitle>
                      <DialogDescription className="text-black/70 text-base">
                        Use Cartridge social login to explore circles, swap, automate DCA, and fund positions without wallet-mode glitches.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      {walletOptions.map((option) => (
                        <Button
                          key={option.id}
                          onClick={async () => {
                            await connectWallet(option.id);
                            setWalletDialogOpen(false);
                          }}
                          disabled={isConnecting || !option.installed}
                          variant="outline"
                          className="justify-between border-[2px] border-black bg-white px-5 py-6 text-left font-bold text-[15px] shadow-[2px_2px_0px_0px_#1a1a1a] hover:shadow-[4px_4px_0px_0px_#1a1a1a] disabled:opacity-50"
                        >
                          <span>{option.name}</span>
                          <span className="text-xs uppercase tracking-wide text-black/60">
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
