import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: vi.fn() }));
vi.mock('@/composables/useApi', () => ({
  apiGet: vi.fn().mockResolvedValue({ data: [] }),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: {} })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: {
    'en-US': {
      admin: {
        manageTcgs: 'Manage TCGs',
        manageUsers: 'Manage Users',
        manageStores: 'Manage Stores',
        reports: 'Reports',
        auditLog: 'Audit Log',
        dashboard: 'Dashboard',
        newFormat: 'New Format',
        ban: 'Ban',
        unban: 'Unban',
        promote: 'Promote',
        columns: {
          name: 'Name',
          status: 'Status',
          city: 'City',
          type: 'Type',
          reason: 'Reason',
          date: 'Date',
          actions: 'Actions',
          target: 'Target',
          slug: 'Slug',
        },
        deleteConfirm: 'Delete?',
        banConfirm: 'Ban?',
        unbanConfirm: 'Unban?',
        promoteConfirm: 'Promote?',
      },
      auth: { username: 'Username', email: 'Email' },
      common: { noResults: 'No results', cancel: 'Cancel', delete: 'Delete', status: 'Status' },
      store: { name: 'Name', details: 'Details' },
      event: { status: 'Status' },
      profile: { role: 'Role' },
    },
  },
});

function commonStubs() {
  return {
    'q-page': { template: '<div><slot /></div>' },
    AdminPageHeader: { template: '<div />' },
    AdminTable: { template: '<div />' },
    AdminFormDialog: { template: '<div />' },
    ConfirmDeleteDialog: { template: '<div />' },
    StatusBadge: { template: '<span class="status-badge"><slot /></span>' },
    'q-btn': { template: '<button><slot /></button>' },
    'q-badge': { template: '<span><slot /></span>' },
    'q-dialog': { template: '<div><slot /></div>' },
    'q-input': { template: '<input />' },
  };
}

describe('AdminPages', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders admin dashboard', async () => {
    const Dashboard = (await import('../admin/AdminDashboardPage.vue')).default;
    const wrapper = shallowMount(Dashboard, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: { 'q-page': { template: '<div><slot /></div>' } },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders TCG list page', async () => {
    const TcgList = (await import('../admin/TcgListPage.vue')).default;
    const wrapper = shallowMount(TcgList, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: commonStubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders user list page', async () => {
    const UserList = (await import('../admin/UserListPage.vue')).default;
    const wrapper = shallowMount(UserList, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: commonStubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders store manage list page', async () => {
    const StoreList = (await import('../admin/StoreManageListPage.vue')).default;
    const wrapper = shallowMount(StoreList, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: commonStubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders audit log page', async () => {
    const AuditLog = (await import('../admin/AuditLogPage.vue')).default;
    const wrapper = shallowMount(AuditLog, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: commonStubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders reports page', async () => {
    const Reports = (await import('../admin/ReportListPage.vue')).default;
    const wrapper = shallowMount(Reports, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: commonStubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders format list page', async () => {
    const FormatList = (await import('../admin/FormatListPage.vue')).default;
    const wrapper = shallowMount(FormatList, {
      global: {
        plugins: [i18n, createPinia()],
        stubs: commonStubs(),
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
