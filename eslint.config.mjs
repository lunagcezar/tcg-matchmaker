import js from '@eslint/js';
import globals from 'globals';
import tsEslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    name: 'tcg/ignores',
    ignores: [
      '**/.agents/**',
      '**/.husky/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/.quasar/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/src-pwa/**',
    ],
  },

  js.configs.recommended,

  ...tsEslint.configs.recommended,

  eslintPluginPrettierRecommended,

  {
    name: 'tcg/language-options',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: false,
      },
    },
  },

  {
    name: 'tcg/custom-rules',
    files: ['**/*.{js,mjs,ts}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-debugger': globalThis.process?.env?.NODE_ENV === 'production' ? 'error' : 'off',
    },
  },
];
