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
- Install and configure ESLint v9, TypeScript ESLint (type-checked), Vue ESLint, and Prettier integration at the root.
- Create per-package `eslint.config.js` files for `packages/worker` and `packages/shared` that extend the root base.
- Refactor `packages/frontend/eslint.config.js` to import the root base and layer on Quasar-specific rules.
- Update root and package `lint` scripts and `lint-staged` configuration.
- Remove the duplicate frontend `.prettierrc.json` and rely on the root `.prettierrc`.

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
- **REQ-003**: The root configuration must lint Vue single-file components (`.vue`).
- **REQ-004**: The root configuration must integrate Prettier so that formatting issues are reported as ESLint errors.
- **REQ-005**: `packages/worker` and `packages/shared` must have their own `eslint.config.js` that extends the root base.
- **REQ-006**: `packages/frontend` must continue to apply Quasar-specific ESLint rules by extending the root base.
- **REQ-007**: The root `lint` script must lint all packages in the monorepo.
- **REQ-008**: All ESLint commands must use `--cache` for incremental runs.
- **REQ-009**: `lint-staged` must run ESLint and Prettier consistently for staged files.
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

Non-type-checked rules are used to keep `pnpm lint` fast, with `--cache` enabled for incremental runs. Type checking remains the responsibility of `tsc --noEmit` and `vue-tsc --noEmit`. `flat/recommended` Vue rules were chosen to improve consistency across Vue components.

## 8. Dependencies & External Integrations

### Technology Platform Dependencies

- **PLT-001**: Node.js compatible with ESLint v9 and TypeScript ESLint v8.
- **PLT-002**: pnpm workspace monorepo structure.

### Tool Dependencies

- ESLint v9
- `typescript-eslint`
- `eslint-plugin-vue`
- `@vue/eslint-config-typescript`
- `@vue/eslint-config-prettier`
- `eslint-plugin-prettier`
- `eslint-config-prettier`
- `vue-eslint-parser`
- `globals`

## 9. Examples & Edge Cases

### Root base config snippet

```js
import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfigWithVueTs(
  {
    name: 'tcg/ignores',
    ignores: ['**/dist/**', '**/node_modules/**', '**/.quasar/**'],
  },
  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  eslintPluginPrettierRecommended,
  {
    name: 'tcg/language-options',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    name: 'tcg/rules',
    files: ['**/*.{ts,vue}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
);
```

### Worker package config snippet

```js
import rootConfig from '../../eslint.config.mjs';

export default [...rootConfig];
```

## 10. Validation Criteria

- `pnpm lint` exits with code 0 after all auto-fixable issues are resolved.
- `pnpm -F @tcg/frontend lint` exits with code 0.
- `pnpm -F @tcg/worker lint` exits with code 0.
- `pnpm -F @tcg/shared lint` exits with code 0.
- `pnpm -F @tcg/frontend typecheck` exits with code 0.
- `pnpm exec lint-staged` runs successfully on a staged changed file.

### Known Issues

- Frontend lint logs a benign warning about multiple `eslint-plugin-vue` instances being loaded. This happens because root and frontend each resolve their own copy of the same version via the pnpm workspace layout. It does not fail lint or affect rule behavior.

## 11. Related Specifications / Further Reading

- [spec-015-frontend-foundation.md](./spec-015-frontend-foundation.md)
- [spec-024-dev-environment.md](./spec-024-dev-environment.md)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)
- [typescript-eslint](https://typescript-eslint.io/)
- [eslint-plugin-vue](https://eslint.vuejs.org/)
