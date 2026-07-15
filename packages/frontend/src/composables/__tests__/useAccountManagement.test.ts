import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubGlobal('fetch', vi.fn());

describe('useAccountManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes account', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: { success: true } }),
    });

    const { deleteAccount } = await import('../useAccountManagement');
    const result = await deleteAccount();

    expect(result).toEqual({ success: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/account'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('handles delete account error', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: null, error: 'Promote another admin before deleting your account' }),
    });

    const { deleteAccount } = await import('../useAccountManagement');
    const result = await deleteAccount();

    expect(result).toEqual({ error: 'Promote another admin before deleting your account' });
  });

  it('suspends account', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: { success: true } }),
    });

    const { suspendAccount } = await import('../useAccountManagement');
    const result = await suspendAccount();

    expect(result).toEqual({ success: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/suspend'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('exports data', async () => {
    const mockData = { profile: { display_name: 'Test' }, consents: [] };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ data: mockData }),
    });

    const { exportData } = await import('../useAccountManagement');
    const result = await exportData();

    expect(result).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/export'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
