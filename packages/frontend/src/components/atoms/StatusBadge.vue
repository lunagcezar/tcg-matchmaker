<template>
  <q-badge :color="color" class="status-badge">
    {{ label }}
  </q-badge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export interface StatusBadgeProps {
  status: string;
  i18nPrefix?: string;
}

const props = withDefaults(defineProps<StatusBadgeProps>(), {
  i18nPrefix: 'common.status',
});

const { t } = useI18n();

const statusColorMap: Record<string, string> = {
  open: 'positive',
  confirmed: 'positive',
  completed: 'positive',
  cancelled: 'negative',
  pending: 'warning',
  resolved: 'positive',
  dismissed: 'grey',
  active: 'positive',
  inactive: 'grey',
  banned: 'negative',
  suspended: 'warning',
  in_progress: 'info',
  planned: 'warning',
  challenged: 'warning',
  draft: 'grey',
  checked_in: 'info',
  declined: 'negative',
  walkover: 'warning',
};

const color = computed(() => statusColorMap[props.status.toLowerCase()] ?? 'grey');

const label = computed(() => {
  const key = `${props.i18nPrefix}.${props.status}`;
  const fallback = props.status.charAt(0).toUpperCase() + props.status.slice(1);
  return t(key, fallback);
});
</script>

<style scoped>
.status-badge {
  text-transform: capitalize;
}
</style>
