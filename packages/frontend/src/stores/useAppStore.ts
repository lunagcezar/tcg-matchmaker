import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  const locale = ref('en-US');
  const darkMode = ref(false);

  function setLocale(l: string) {
    locale.value = l;
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value;
  }

  return { locale, darkMode, setLocale, toggleDarkMode };
});
