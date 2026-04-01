import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Wallet, Menu, X, Users, TrendingUp, User, ArrowRightLeft, Repeat, PiggyBank, FileText, BookOpen, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { formatAddress } from '@/lib/constants';
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
  { href: '/dashboard', label: 'My Circles', icon: TrendingUp },
  { href: '/logs', label: 'Logs', icon: FileText },
  { href: '/profile', label: 'Profile', icon: User },
];

const sdkItems = [
  { href: '/sdk', label: 'SDK Help', description: 'Overview of the StarkZap v2 integration.', icon: BookOpen },
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
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet, walletOptions, balance, balanceLoading } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const location = useLocation();
  const balanceLabel = balanceLoading ? '...' : balance ? `${parseFloat(balance.formatted).toFixed(2)} ${balance.symbol}` : '0.00 STRK';

  return (
    <header className="sticky top-0 z-50 border-b-[2px] border-black bg-[#FEFAE0]/95 backdrop-blur-sm">
      <div className="page-shell">
        <div className="flex min-h-[4.65rem] items-center justify-between gap-3 py-2.5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-10 w-10 items-center justify-center border-[2px] border-black bg-[#FF6B6B] transition-all group-hover:shadow-[3px_3px_0px_0px_#1a1a1a]">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-[1.35rem] font-black tracking-tight sm:text-[1.65rem]">
              Circle<span className="text-[#FF6B6B]">Save</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-none border-[2px] px-2.5 py-1.5 text-[12px] font-black uppercase tracking-[0.03em] transition-all xl:px-2.5 xl:text-[13px]
                  ${isNavItemActive(location.pathname, item.href)
                    ? 'border-black bg-black text-white shadow-[2px_2px_0px_0px_#1a1a1a]'
                    : 'border-transparent hover:border-black hover:shadow-[1px_1px_0px_0px_#1a1a1a]'
                  }`}
              >
                {item.icon ? <item.icon className="h-3.5 w-3.5" /> : null}
                {item.label}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-none border-[2px] px-2.5 py-1.5 text-[12px] font-black uppercase tracking-[0.03em] transition-all xl:px-2.5 xl:text-[13px]
                    ${isSdkItemActive(location.pathname)
                      ? 'border-black bg-black text-white shadow-[2px_2px_0px_0px_#1a1a1a]'
                      : 'border-transparent hover:border-black hover:shadow-[1px_1px_0px_0px_#1a1a1a]'
                    }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  SDK
                  <ChevronDown className="h-3.5 w-3.5" />
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
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center gap-2 lg:gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 bg-white border-[2px] border-black shadow-[1px_1px_0px_0px_#1a1a1a]">
                  <Wallet className="w-4 h-4 text-[#4ECDC4]" />
                  <span className="font-bold text-[14px] whitespace-nowrap">{balanceLabel}</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-[#FFE66D] border-[2px] border-black shadow-[1px_1px_0px_0px_#1a1a1a]">
                  <User className="w-4 h-4" />
                  <span className="font-bold text-[15px] whitespace-nowrap">{formatAddress(address!)}</span>
                </div>
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  className="border-[2px] border-black px-3 py-2 shadow-[1px_1px_0px_0px_#1a1a1a] hover:shadow-[3px_3px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all font-bold text-[15px]"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => setWalletDialogOpen(true)}
                  disabled={isConnecting}
                  className="neo-button-primary"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
                <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
                  <DialogContent className="border-[2px] border-black bg-[#FEFAE0] shadow-[4px_4px_0px_0px_#1a1a1a]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black">Connect Wallet</DialogTitle>
                      <DialogDescription className="text-black/70 text-base">
                        Choose a wallet or use Cartridge social login to explore circles, swap, automate DCA, and invest.
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
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border-[2px] border-black bg-white shadow-[1px_1px_0px_0px_#1a1a1a] lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="py-4 border-t-[2px] border-black lg:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
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
                  {item.icon ? <item.icon className="h-4 w-4" /> : null}
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
      </div>
    </header>
  );
}
