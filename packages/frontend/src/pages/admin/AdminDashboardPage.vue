<template>
  <q-page class="q-pa-md">
    <h5>Admin Dashboard</h5>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4" v-for="card in cards" :key="card.to">
        <q-card clickable :to="card.to" class="q-pa-md">
          <q-card-section class="text-center">
            <q-icon :name="card.icon" size="48px" color="primary" />
            <div class="text-h6 q-mt-sm">{{ card.title }}</div>
            <div class="text-caption">{{ card.desc }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
const cards = [
  { title: 'TCGs', desc: 'Manage Trading Card Games', icon: 'category', to: '/admin/tcgs' },
  { title: 'Users', desc: 'Manage user accounts', icon: 'people', to: '/admin/users' },
  { title: 'Reports', desc: 'Moderate reported content', icon: 'flag', to: '/admin/reports' },
  { title: 'Audit Log', desc: 'Review moderation actions', icon: 'history', to: '/admin/audit' },
];
</script>
