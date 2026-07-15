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

export const headerNavItems: NavItem[] = [
  ...eventNavItems,
  { labelKey: 'nav.stores', to: '/stores' },
];
