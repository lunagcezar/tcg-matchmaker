import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/pages/IndexPage.vue') },
      { path: 'login', name: 'login', component: () => import('@/pages/auth/LoginPage.vue') },
      { path: 'signup', name: 'signup', component: () => import('@/pages/auth/SignupPage.vue') },
      { path: 'onboarding', name: 'onboarding', component: () => import('@/pages/auth/OnboardingPage.vue'), meta: { requiresOnboarding: true } },
      { path: 'profile/:username', name: 'profile', component: () => import('@/pages/ProfilePage.vue') },
      { path: 'settings', name: 'settings', component: () => import('@/pages/SettingsPage.vue'), meta: { requiresAuth: true } },
      { path: 'matches/new', name: 'matches-create', component: () => import('@/pages/matches/CreatePage.vue'), meta: { requiresAuth: true } },
      { path: 'matches/:id', name: 'match-detail', component: () => import('@/pages/matches/DetailPage.vue') },
      { path: 'trading/new', name: 'trading-create', component: () => import('@/pages/trading/CreatePage.vue'), meta: { requiresAuth: true } },
      { path: 'trading/:id', name: 'trading-detail', component: () => import('@/pages/trading/DetailPage.vue') },
      { path: 'tournaments/new', name: 'tournament-create', component: () => import('@/pages/tournaments/CreatePage.vue'), meta: { requiresAuth: true } },
      { path: 'tournaments/:id', name: 'tournament-detail', component: () => import('@/pages/tournaments/DetailPage.vue') },
      { path: 'tournaments/:id/manage', name: 'tournament-manage', component: () => import('@/pages/tournaments/ManagePage.vue'), meta: { requiresAuth: true } },
      { path: 'stores', name: 'stores', component: () => import('@/pages/stores/ListPage.vue') },
      { path: 'stores/new', name: 'store-create', component: () => import('@/pages/stores/CreatePage.vue'), meta: { requiresAuth: true } },
      { path: 'stores/:id', name: 'store-detail', component: () => import('@/pages/stores/DetailPage.vue') },
      { path: 'stores/:id/settings', name: 'store-settings', component: () => import('@/pages/stores/SettingsPage.vue'), meta: { requiresAuth: true } },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', name: 'admin', component: () => import('@/pages/admin/AdminDashboardPage.vue') },
      { path: 'tcgs', name: 'admin-tcgs', component: () => import('@/pages/admin/TcgListPage.vue') },
      { path: 'users', name: 'admin-users', component: () => import('@/pages/admin/UserListPage.vue') },
      { path: 'reports', name: 'admin-reports', component: () => import('@/pages/admin/ReportListPage.vue') },
      { path: 'audit', name: 'admin-audit', component: () => import('@/pages/admin/AuditLogPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
