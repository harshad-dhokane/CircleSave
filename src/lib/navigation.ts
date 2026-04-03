import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightLeft,
  Blocks,
  FileText,
  LayoutDashboard,
  PiggyBank,
  Plus,
  Repeat,
  UserRound,
  Users,
} from 'lucide-react';

export type AppNavigationItem = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

export type AppNavigationSection = {
  title: string;
  items: AppNavigationItem[];
};

export const appNavigationSections: AppNavigationSection[] = [
  {
    title: '',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        description: 'Monitor the current operating snapshot.',
        icon: LayoutDashboard,
        accent: '#B5F36B',
      },
      {
        to: '/circles',
        label: 'Circles',
        description: 'Browse, join, and manage circles.',
        icon: Users,
        accent: '#7AE7C7',
      },
      {
        to: '/circles/create',
        label: 'Create Circle',
        description: 'Start a new savings circle.',
        icon: Plus,
        accent: '#FFB457',
      },
      {
        to: '/swap',
        label: 'Swap',
        description: 'Route assets into STRK.',
        icon: ArrowRightLeft,
        accent: '#B5F36B',
      },
      {
        to: '/batching',
        label: 'Batch',
        description: 'Bundle multiple actions into one flow.',
        icon: Blocks,
        accent: '#FFB457',
      },
      {
        to: '/dca',
        label: 'DCA',
        description: 'Plan recurring buys.',
        icon: Repeat,
        accent: '#A48DFF',
      },
      {
        to: '/lending',
        label: 'Lend',
        description: 'Put idle assets to work through Vesu.',
        icon: PiggyBank,
        accent: '#7AE7C7',
      },
      {
        to: '/logs',
        label: 'Logs',
        description: 'Inspect detailed activity and provider responses.',
        icon: FileText,
        accent: '#FF7B72',
      },
      {
        to: '/profile',
        label: 'Profile',
        description: 'Review balances, reputation, and ownership.',
        icon: UserRound,
        accent: '#7CC8FF',
      },
    ],
  },
];

export const footerLinkGroups = {
  product: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Profile', to: '/profile' },
    { label: 'Circles', to: '/circles' },
    { label: 'Create Circle', to: '/circles/create' },
    { label: 'Swap', to: '/swap' },
    { label: 'DCA', to: '/dca' },
    { label: 'Lending', to: '/lending' },
    { label: 'Logs', to: '/logs' },
  ],
  resources: [
    { label: 'Help Center', to: '/sdk' },
    { label: 'Leaderboard', to: '/leaderboard' },
    { label: 'Contracts', to: '/contracts' },
  ],
  legal: [
    { label: 'Terms', to: '/terms' },
    { label: 'Privacy', to: '/privacy' },
  ],
} as const;

type PageMeta = {
  matches: (pathname: string, search: string) => boolean;
  title: string;
  badge: string;
};

const pageMeta: PageMeta[] = [
  {
    matches: (pathname) => pathname === '/dashboard',
    title: 'Dashboard',
    badge: 'Workspace',
  },
  {
    matches: (pathname) => pathname === '/profile' || /^\/profile\/[^/]+$/.test(pathname),
    title: 'Profile',
    badge: 'Profile',
  },
  {
    matches: (pathname) => pathname === '/circles',
    title: 'Circles',
    badge: 'Circles',
  },
  {
    matches: (pathname) => /^\/circles\/[^/]+$/.test(pathname) && pathname !== '/circles/create',
    title: 'Circle',
    badge: 'Circles',
  },
  {
    matches: (pathname) => pathname === '/circles/create',
    title: 'Create Circle',
    badge: 'Setup',
  },
  {
    matches: (pathname) => pathname === '/swap',
    title: 'Swap',
    badge: 'Automation',
  },
  {
    matches: (pathname) => pathname === '/batching',
    title: 'Batch',
    badge: 'Automation',
  },
  {
    matches: (pathname) => pathname === '/dca',
    title: 'DCA',
    badge: 'Automation',
  },
  {
    matches: (pathname) => pathname === '/lending',
    title: 'Lend',
    badge: 'Automation',
  },
  {
    matches: (pathname) => pathname === '/logs',
    title: 'Logs',
    badge: 'Review',
  },
  {
    matches: (pathname) => pathname === '/sdk',
    title: 'Help Center',
    badge: 'Support',
  },
  {
    matches: (pathname) => pathname === '/leaderboard',
    title: 'Leaderboard',
    badge: 'Community',
  },
  {
    matches: (pathname) => pathname === '/how-it-works',
    title: 'How It Works',
    badge: 'Guide',
  },
  {
    matches: (pathname) => pathname === '/contracts',
    title: 'Contracts',
    badge: 'Security',
  },
  {
    matches: (pathname) => pathname === '/api',
    title: 'API',
    badge: 'Developers',
  },
  {
    matches: (pathname) => pathname === '/terms',
    title: 'Terms',
    badge: 'Legal',
  },
  {
    matches: (pathname) => pathname === '/privacy',
    title: 'Privacy',
    badge: 'Legal',
  },
  {
    matches: (pathname) => pathname === '/risk-disclosure',
    title: 'Risk Disclosure',
    badge: 'Legal',
  },
];

export function isAppRouteActive(pathname: string, search: string, to: string) {
  const [targetPath, targetQuery] = to.split('?');

  if (targetPath === '/circles') {
    return pathname === '/circles' || (/^\/circles\/[^/]+$/.test(pathname) && pathname !== '/circles/create');
  }

  if (targetPath === '/circles/create') {
    return pathname === '/circles/create';
  }

  if (targetPath === '/') {
    return pathname === '/';
  }

  if (targetQuery) {
    if (pathname !== targetPath) {
      return false;
    }

    const currentSearch = new URLSearchParams(search);
    const requiredSearch = new URLSearchParams(targetQuery);

    return [...requiredSearch.entries()].every(([key, value]) => currentSearch.get(key) === value);
  }

  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}

export function getPageMeta(pathname: string, search = '') {
  return pageMeta.find((entry) => entry.matches(pathname, search)) ?? {
    title: 'CircleSave Workspace',
    badge: 'Workspace',
  };
}
