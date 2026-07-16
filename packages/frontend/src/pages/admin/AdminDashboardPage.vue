<template>
  <q-page class="q-py-md">
    <h5>{{ $t('admin.dashboard') }}</h5>
    <div class="admin-dashboard-grid">
      <router-link v-for="card in cards" :key="card.to" :to="card.to" class="admin-dashboard__link">
        <q-icon :name="card.icon" size="36px" color="primary" />
        <div class="text-h6 q-mt-sm">{{ card.title }}</div>
        <div class="text-caption">{{ card.desc }}</div>
      </router-link>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const cards = [
  {
    title: t('admin.manageTcgs'),
    desc: 'Manage Trading Card Games',
    icon: 'category',
    to: '/admin/tcgs',
  },
  {
    title: t('admin.manageUsers'),
    desc: 'Manage user accounts',
    icon: 'people',
    to: '/admin/users',
  },
  {
    title: t('admin.reports'),
    desc: 'Moderate reported content',
    icon: 'flag',
    to: '/admin/reports',
  },
  {
    title: t('admin.auditLog'),
    desc: 'Review moderation actions',
    icon: 'history',
    to: '/admin/audit',
  },
];
</script>

<style scoped>
.admin-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.admin-dashboard__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background-color: var(--card);
  color: var(--card-foreground);
  text-decoration: none;
  text-align: center;
  transition: background-color 0.2s ease;
}

.admin-dashboard__link:hover {
  background-color: var(--muted);
}
</style>
