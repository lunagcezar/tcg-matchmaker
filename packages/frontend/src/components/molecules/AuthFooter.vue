<template>
  <div class="flex flex-center row q-gutter-sm">
    <span>{{ $t(messageKey) }}</span>
    <q-btn flat color="primary" :label="$t(linkLabel)" :to="linkTo" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  mode: 'login' | 'signup';
}>();

const messageKey = computed(() => (props.mode === 'login' ? 'auth.noAccount' : 'auth.haveAccount'));
const linkLabel = computed(() => (props.mode === 'login' ? 'auth.signUp' : 'auth.signIn'));
const linkTo = computed(() => (props.mode === 'login' ? '/signup' : '/login'));
</script>
