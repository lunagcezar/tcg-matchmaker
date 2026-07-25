import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

function getStorageItem(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
  }
}

function getDefaultLocale(): string {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }
  return 'en-US';
}

export const useAppStore = defineStore('app', () => {
  const locale = ref(getStorageItem('locale') || getDefaultLocale());
  const darkMode = ref(getStorageItem('dark') === 'true');

  watch(locale, (val) => setStorageItem('locale', val));
  watch(darkMode, (val) => setStorageItem('dark', String(val)));

  function setLocale(l: string) {
    locale.value = l;
  }
  function toggleDarkMode() {
    darkMode.value = !darkMode.value;
  }

  return { locale, darkMode, setLocale, toggleDarkMode };
});
