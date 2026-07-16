export interface NavItem {
  labelKey?: string;
  to?: string;
  icon?: string;
  auth?: boolean;
  divider?: boolean;
  exact?: boolean;
}

export interface NavNode {
  labelKey: string;
  href: string;
  adminOnly?: boolean;
  exact?: boolean;
  children?: NavNode[];
}

export const navItems: NavItem[] = [
  { labelKey: 'nav.matches', to: '/matches', icon: 'sports_esports' },
  { labelKey: 'nav.trading', to: '/trading', icon: 'swap_horiz' },
  { labelKey: 'nav.tournaments', to: '/tournaments', icon: 'emoji_events' },
  { labelKey: 'nav.stores', to: '/stores' },
];

export const navTree: NavNode[] = [
  { labelKey: 'nav.home', href: '/', exact: true },
  { labelKey: 'nav.matches', href: '/matches' },
  { labelKey: 'nav.trading', href: '/trading' },
  { labelKey: 'nav.tournaments', href: '/tournaments' },
  { labelKey: 'nav.stores', href: '/stores' },
  {
    labelKey: 'nav.admin',
    href: '/admin',
    adminOnly: true,
    children: [
      { labelKey: 'admin.dashboard', href: '/admin' },
      { labelKey: 'admin.manageTcgs', href: '/admin/tcgs' },
      { labelKey: 'admin.manageUsers', href: '/admin/users' },
      { labelKey: 'admin.manageStores', href: '/admin/stores' },
      { labelKey: 'admin.reports', href: '/admin/reports' },
      { labelKey: 'admin.auditLog', href: '/admin/audit' },
    ],
  },
];
