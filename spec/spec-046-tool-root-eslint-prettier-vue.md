---
title: Root ESLint v9 Flat Config with Prettier and Vue
date_created: 2026-07-15
owner: TCG Matchmaker Team
tags: [tool, linting, formatting, monorepo]
---

# Introduction

This specification defines the migration of the workspace root ESLint configuration to a single ESLint v9 flat config that consolidates Prettier and Vue linting across the monorepo. The current setup has a legacy ESLint v8 `.eslintrc.cjs` at the root, a separate ESLint v9 flat config in `packages/frontend`, and no ESLint at all in `packages/worker` and `packages/shared`.

## 1. Purpose & Scope

**Purpose**: Provide a single, maintainable linting and formatting foundation at the workspace root that all packages share, while preserving the frontend's Quasar-specific additions.

**Scope**:

- Replace `.eslintrc.cjs` at the root with `eslint.config.mjs`.
- Install and configure ESLint v9, TypeScript ESLint, and Prettier integration at the root.
- Create per-package `eslint.config.js` files for `packages/worker` and `packages/shared` that extend the root base.
- Refactor `packages/frontend/eslint.config.js` to import the root base and layer on Quasar-specific and Vue-specific rules.
- Update root and package `lint` scripts and `lint-staged` configuration so formatting is handled at the root.
- Remove the duplicate frontend `.prettierrc.json` and rely on the root `.prettierrc`.
- Add `.prettierignore` to skip agent skill files and lockfiles.

**Out of scope**: Changing Prettier formatting rules or enforcing new code-style preferences beyond the existing `singleQuote`, `trailingComma: all`, `printWidth: 100` settings.

## 2. Definitions

| Term                | Definition                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Flat config         | ESLint v9's new configuration format (`eslint.config.js` / `.mjs`) based on an array of configuration objects. |
| Type-checked rules  | TypeScript ESLint rules that require type information from the TypeScript program.                             |
| `projectService`    | The TypeScript ESLint mechanism to provide type information without explicit `tsconfig` paths.                 |
| `skip-formatting`   | Prettier ESLint integration mode that disables formatting rules but does not report formatting issues.         |
| `report-formatting` | Prettier ESLint integration mode that reports Prettier formatting issues as ESLint errors.                     |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: The root ESLint configuration must use ESLint v9 flat config format.
- **REQ-002**: The root configuration must lint TypeScript files with non-type-checked rules for fast feedback.
- **REQ-003**: The root configuration must provide a base for Vue SFC linting by configuring TypeScript rules; Vue-specific parser and rules are added in `packages/frontend` to avoid duplicate ESLint plugin instances in the monorepo.
- **REQ-004**: The root configuration must integrate Prettier so that formatting issues are reported as ESLint errors.
- **REQ-005**: `packages/worker` and `packages/shared` must have their own `eslint.config.js` that extends the root base.
- **REQ-006**: `packages/frontend` must extend the root base and add Quasar-specific and Vue-specific ESLint rules.
- **REQ-007**: The root `lint` script must check formatting and lint all packages in the monorepo.
- **REQ-008**: All ESLint commands must use `--cache` for incremental runs.
- **REQ-009**: `lint-staged` must run ESLint and Prettier consistently for staged files.
- **REQ-010**: Prettier must ignore agent skill files and lockfiles via `.prettierignore`.
- **CON-001**: ESLint must not access files outside the workspace.
- **CON-002**: Type checking remains the responsibility of `tsc --noEmit` and `vue-tsc --noEmit`, not ESLint.
- **GUD-001**: Keep changes minimal; avoid unrelated formatting churn in unrelated files.
- **GUD-002**: Reuse the root `.prettierrc` configuration across all packages.

## 4. Interfaces & Data Contracts

There are no runtime APIs or data contracts for this specification. The deliverables are configuration files and package metadata.

### Configuration Surface

- `eslint.config.mjs` at workspace root exports the shared base config array.
- `packages/*/eslint.config.js` imports from `../../eslint.config.mjs` and re-exports an extended array.

## 5. Acceptance Criteria

- **AC-001**: Given the repository, when `pnpm lint` is run from the root, then ESLint runs successfully against all packages without configuration errors.
- **AC-002**: Given a `.vue` file with a formatting issue, when `pnpm lint` is run, then ESLint reports the formatting error.
- **AC-003**: Given a TypeScript file with an unused variable, when `pnpm lint` is run, then ESLint reports the issue.
- **AC-004**: Given `packages/worker/eslint.config.js` exists, when `pnpm -F @tcg/worker lint` is run, then ESLint lints the worker source files using the root base config.
- **AC-005**: Given `packages/shared/eslint.config.js` exists, when `pnpm -F @tcg/shared lint` is run, then ESLint lints the shared source files using the root base config.
- **AC-006**: Given the frontend config extends the root base, when `pnpm -F @tcg/frontend lint` is run, then Quasar-specific rules are still applied.
- **AC-007**: Given the root `.prettierrc`, when Prettier formats a file, then it uses `singleQuote`, `trailingComma: all`, and `printWidth: 100`.

## 6. Test Automation Strategy

- **Manual validation**: Run `pnpm lint` and `pnpm format` after implementation and fix any newly reported issues.
- **lint-staged validation**: Stage a changed file and run `pnpm exec lint-staged` to verify the updated hooks.
- **Regression**: Ensure existing frontend build (`pnpm -F @tcg/frontend build`) still passes.

## 7. Rationale & Context

A single root ESLint configuration reduces duplication and drift between packages. It also ensures that shared code in `packages/shared` and worker code in `packages/worker` receive the same linting baseline as the frontend. Migrating to ESLint v9 flat config aligns the root with the frontend's existing setup and unlocks modern plugin configurations.

Non-type-checked rules are used to keep `pnpm lint` fast, with `--cache` enabled for incremental runs. Type checking remains the responsibility of `tsc --noEmit` and `vue-tsc --noEmit`. `flat/recommended` Vue rules are applied in the frontend package only. Keeping Vue-specific ESLint dependencies in the frontend package prevents duplicate plugin instances from being loaded when the root config is imported by the frontend, which avoids the `eslint-plugin-vue` duplication warning in monorepo setups.

## 8. Dependencies & External Integrations

### Technology Platform Dependencies

- **PLT-001**: Node.js compatible with ESLint v9 and TypeScript ESLint v8.
- **PLT-002**: pnpm workspace monorepo structure.

### Tool Dependencies

- ESLint v9
- `typescript-eslint`
- `eslint-plugin-prettier`
- `eslint-config-prettier`
- `globals`

### Frontend-Only Tool Dependencies

- `eslint-plugin-vue`
- `vue-eslint-parser`
- `@quasar/app-vite`

## 9. Examples & Edge Cases

### Root base config snippet

```js
import js from '@eslint/js';
import globals from 'globals';
import tsEslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    name: 'tcg/ignores',
    ignores: ['**/.agents/**', '**/dist/**', '**/node_modules/**', '**/.quasar/**'],
  },
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    name: 'tcg/language-options',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: false },
    },
  },
  {
    name: 'tcg/rules',
    files: ['**/*.{js,mjs,ts}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-debugger': globalThis.process?.env?.NODE_ENV === 'production' ? 'error' : 'off',
    },
  },
];
```

### Frontend package config snippet

```js
import pluginQuasar from '@quasar/app-vite/eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tsEslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';
import rootConfig from '../../eslint.config.mjs';

export default [
  { ignores: ['**/__tests__/**', '**/e2e/**'] },
  ...pluginQuasar.configs.recommended(),
  ...rootConfig,
  ...pluginVue.configs['flat/recommended'],
  {
    name: 'tcg/frontend/vue-typescript-parser',
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tsEslint.parser, sourceType: 'module' },
    },
  },
  prettierRecommended,
  {
    name: 'tcg/frontend/language-options',
    languageOptions: {
      globals: {
        process: 'readonly',
        ga: 'readonly',
        cordova: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly',
        browser: 'readonly',
      },
    },
    rules: {
      'prefer-promise-reject-errors': 'off',
      'no-debugger': globalThis.process?.env?.NODE_ENV === 'production' ? 'error' : 'off',
    },
  },
  {
    name: 'tcg/frontend/service-worker',
    files: ['src-pwa/sw/**/*.ts'],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
];
```

### Worker package config snippet

```js
import rootConfig from '../../eslint.config.mjs';

export default [...rootConfig];
```

## 10. Validation Criteria

- `pnpm lint` exits with code 0 after all auto-fixable issues are resolved.
- `pnpm -F @tcg/frontend lint` exits with code 0 with no plugin-duplication warnings.
- `pnpm -F @tcg/worker lint` exits with code 0.
- `pnpm -F @tcg/shared lint` exits with code 0.
- `pnpm -F @tcg/frontend typecheck` exits with code 0.
- `pnpm exec lint-staged` runs successfully on a staged changed file.

## 11. Related Specifications / Further Reading

- [spec-015-frontend-foundation.md](./spec-015-frontend-foundation.md)
- [spec-024-dev-environment.md](./spec-024-dev-environment.md)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)
- [typescript-eslint](https://typescript-eslint.io/)
- [eslint-plugin-vue](https://eslint.vuejs.org/)
