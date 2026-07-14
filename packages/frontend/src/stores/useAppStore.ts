import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useAppStore = defineStore('app', () => {
  const locale = ref(localStorage.getItem('locale') || navigator.language || 'en-US');
  const darkMode = ref(localStorage.getItem('dark') === 'true');

  watch(locale, (val) => localStorage.setItem('locale', val));
  watch(darkMode, (val) => localStorage.setItem('dark', String(val)));

  function setLocale(l: string) { locale.value = l; }
  function toggleDarkMode() { darkMode.value = !darkMode.value; }

  return { locale, darkMode, setLocale, toggleDarkMode };
});
