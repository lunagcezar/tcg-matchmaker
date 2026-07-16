import { describe, it, expect } from 'vitest';
import { navItems } from '../navItems';

describe('navItems', () => {
  describe('navItems', () => {
    it('includes matches, trading, tournaments, and stores', () => {
      const labels = navItems.map((item) => item.labelKey);
      expect(labels).toContain('nav.matches');
      expect(labels).toContain('nav.trading');
      expect(labels).toContain('nav.tournaments');
      expect(labels).toContain('nav.stores');
    });

    it('does not include home link', () => {
      const homeItem = navItems.find((item) => item.to === '/');
      expect(homeItem).toBeUndefined();
    });

    it('stores link points to /stores', () => {
      const storesItem = navItems.find((item) => item.labelKey === 'nav.stores');
      expect(storesItem?.to).toBe('/stores');
    });
  });
});
