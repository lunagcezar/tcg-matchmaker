export interface NavItem {
  labelKey?: string;
  to?: string;
  icon?: string;
  auth?: boolean;
  divider?: boolean;
  exact?: boolean;
}

export const eventNavItems: NavItem[] = [
  { labelKey: 'nav.matches', to: '/matches', icon: 'sports_esports' },
  { labelKey: 'nav.trading', to: '/trading', icon: 'swap_horiz' },
  { labelKey: 'nav.tournaments', to: '/tournaments', icon: 'emoji_events' },
];

export const drawerNavItems: NavItem[] = [
  { labelKey: 'nav.home', to: '/', icon: 'home' },
  { labelKey: 'nav.stores', to: '/stores', icon: 'store' },
  { divider: true },
  ...eventNavItems,
  { labelKey: 'nav.notifications', to: '/notifications', icon: 'notifications', auth: true },
  { labelKey: 'nav.settings', to: '/settings', icon: 'settings', auth: true },
];

export const headerNavItems = [
  { labelKey: 'nav.home', to: '/', exact: true },
  ...eventNavItems,
];
