<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-red text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleDrawer" />
        <q-toolbar-title>Admin</q-toolbar-title>
      </q-toolbar>
    </q-header>
    <q-drawer v-model="drawerOpen" show-if-above bordered>
      <q-list>
        <q-item clickable to="/admin">
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>
        <q-item clickable to="/admin/tcgs">
          <q-item-section avatar><q-icon name="category" /></q-item-section>
          <q-item-section>TCGs</q-item-section>
        </q-item>
        <q-item clickable to="/admin/users">
          <q-item-section avatar><q-icon name="people" /></q-item-section>
          <q-item-section>Users</q-item-section>
        </q-item>
        <q-item clickable to="/admin/reports">
          <q-item-section avatar><q-icon name="flag" /></q-item-section>
          <q-item-section>Reports</q-item-section>
        </q-item>
        <q-item clickable to="/admin/audit">
          <q-item-section avatar><q-icon name="history" /></q-item-section>
          <q-item-section>Audit Log</q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable to="/">
          <q-item-section avatar><q-icon name="arrow_back" /></q-item-section>
          <q-item-section>Back to App</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const drawerOpen = ref(false);
function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}
</script>
