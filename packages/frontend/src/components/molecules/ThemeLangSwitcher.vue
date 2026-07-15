<template>
  <q-btn
    flat
    round
    :icon="appStore.darkMode ? 'light_mode' : 'dark_mode'"
    @click="appStore.toggleDarkMode()"
  >
    <q-tooltip>{{ $t('common.darkMode') }}</q-tooltip>
  </q-btn>
  <q-btn-dropdown flat :label="currentLangLabel">
    <q-list>
      <q-item
        v-for="lang in languages"
        :key="lang.value"
        v-close-popup
        clickable
        @click="switchLang(lang.value)"
      >
        <q-item-section
          ><q-item-label>{{ lang.label }}</q-item-label></q-item-section
        >
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/useAppStore';

const appStore = useAppStore();
const { locale } = useI18n({ useScope: 'global' });

const languages = [
  { label: 'English', value: 'en-US' },
  { label: 'Português', value: 'pt-BR' },
];

const currentLangLabel = computed(
  () => languages.find((l) => l.value === locale.value)?.label || 'EN',
);

function switchLang(val: string) {
  locale.value = val;
  appStore.setLocale(val);
}
</script>
