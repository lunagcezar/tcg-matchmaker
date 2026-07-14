import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<unknown>(null);
  const isAuthenticated = ref(false);

  function setUser(newUser: unknown) {
    user.value = newUser;
    isAuthenticated.value = !!newUser;
  }

  function logout() {
    user.value = null;
    isAuthenticated.value = false;
  }

  return { user, isAuthenticated, setUser, logout };
});
