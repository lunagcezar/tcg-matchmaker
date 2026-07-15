import pluginQuasar from '@quasar/app-vite/eslint';
import { defineConfigWithVueTs } from '@vue/eslint-config-typescript';
import globals from 'globals';
import rootConfig from '../../eslint.config.mjs';

export default defineConfigWithVueTs(
  {
    /**
     * Ignore the following files.
     * Please note that pluginQuasar.configs.recommended() already ignores
     * the "node_modules" folder for you (and all other Quasar project
     * relevant folders and files).
     *
     * ESLint requires "ignores" key to be the only one in this object
     */
    ignores: ['**/__tests__/**', '**/e2e/**'],
  },

  pluginQuasar.configs.recommended(),

  ...rootConfig,

  {
    name: 'tcg/frontend/language-options',
    languageOptions: {
      globals: {
        process: 'readonly', // process.env.*
        ga: 'readonly', // Google Analytics
        cordova: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly', // BEX related
        browser: 'readonly', // BEX related
      },
    },

    // add your custom rules here
    rules: {
      'prefer-promise-reject-errors': 'off',

      // allow debugger during development only
      'no-debugger': globalThis.process?.env?.NODE_ENV === 'production' ? 'error' : 'off',
    },
  },

  {
    name: 'tcg/frontend/service-worker',
    files: ['src-pwa/sw/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },
);
