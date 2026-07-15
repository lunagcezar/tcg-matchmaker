import { describe, it, expect } from 'vitest';
import { headerNavItems } from '../navItems';

describe('navItems', () => {
  describe('headerNavItems', () => {
    it('includes matches, trading, tournaments, and stores', () => {
      const labels = headerNavItems.map((item) => item.labelKey);
      expect(labels).toContain('nav.matches');
      expect(labels).toContain('nav.trading');
      expect(labels).toContain('nav.tournaments');
      expect(labels).toContain('nav.stores');
    });

    it('does not include home link', () => {
      const homeItem = headerNavItems.find((item) => item.to === '/');
      expect(homeItem).toBeUndefined();
    });

    it('stores link points to /stores', () => {
      const storesItem = headerNavItems.find((item) => item.labelKey === 'nav.stores');
      expect(storesItem?.to).toBe('/stores');
    });
  });
});
