import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/IndexPage.vue') },
      { path: 'login', component: () => import('@/pages/LoginPage.vue') },
      { path: 'signup', component: () => import('@/pages/SignupPage.vue') },
      { path: 'onboarding', component: () => import('@/pages/OnboardingPage.vue') },
      { path: 'profile/:username', component: () => import('@/pages/ProfilePage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
