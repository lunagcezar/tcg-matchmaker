---
title: Wrangler Build Configuration — KV Bindings & Deploy Validation
version: 1.0
date_created: 2026-07-15
tags: operations, wrangler, cloudflare, kv, deployment
---

# Introduction

This specification makes the Worker `pnpm build` command pass by aligning `packages/worker/wrangler.jsonc` with Wrangler v4 validation rules, and documents how production KV namespace IDs are provisioned.

## 1. Purpose & Scope

**Purpose:** Ensure `wrangler deploy --dry-run` succeeds in CI/local builds and provide a clear path for replacing placeholder KV IDs with real ones before production deployment.

**Scope:**

- Upgrade `wrangler` to a v4 release.
- Fix invalid or missing fields in `packages/worker/wrangler.jsonc`.
- Use placeholder KV namespace IDs that pass Wrangler config validation.
- Document KV provisioning via `wrangler kv namespace create --update-config` and the Cloudflare dashboard.

**Out of scope:**

- Creating actual Cloudflare resources (requires authenticated `wrangler login`).
- Changing the Worker runtime code or bindings interface.

## 2. Definitions

- **Wrangler**: Cloudflare's CLI for managing Workers and associated resources.
- **KV namespace**: Cloudflare's key-value storage binding used by the Worker for geocoding cache and rate limiting.
- **Dry-run**: `wrangler deploy --dry-run` bundles the Worker and validates config without uploading it.
- **Placeholder ID**: A non-empty string in `wrangler.jsonc` that passes validation but must be replaced with a real resource ID before deploy.

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: `pnpm -F @tcg/worker build` must complete successfully without a Cloudflare account.
- **REQ-002**: `wrangler.jsonc` must be valid for Wrangler v4 schema validation.
- **REQ-003**: KV namespace bindings must remain present so local dev and future deploys can use them.
- **REQ-004**: Placeholder IDs must be clearly identifiable so they cannot be deployed to production by accident.
- **REQ-005**: Documentation must explain how to replace placeholder IDs with real IDs.
- **CON-001**: Do not commit real Cloudflare resource IDs to the repository.
- **GUD-001**: Prefer `wrangler kv namespace create --update-config` for ID provisioning because it edits `wrangler.jsonc` automatically.

## 4. Interfaces & Data Contracts

### Wrangler configuration shape

```jsonc
// packages/worker/wrangler.jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "tcg-matchmaker-api",
  "main": "src/index.ts",
  "compatibility_date": "2025-02-01",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true,
  },
  "vars": {
    "NOMINATIM_USER_AGENT": "TCGMatchmaker/0.0",
    "SENTRY_DSN": "",
  },
  "kv_namespaces": [
    {
      "binding": "GEOCODING_KV",
      "id": "__SET_GEOCODING_KV_ID_BEFORE_DEPLOY__",
      "preview_id": "__SET_GEOCODING_KV_PREVIEW_ID_BEFORE_DEPLOY__",
    },
    {
      "binding": "RATE_LIMIT_KV",
      "id": "__SET_RATE_LIMIT_KV_ID_BEFORE_DEPLOY__",
      "preview_id": "__SET_RATE_LIMIT_KV_PREVIEW_ID_BEFORE_DEPLOY__",
    },
  ],
}
```

### Build command

```bash
pnpm -F @tcg/worker build
# runs: wrangler deploy --dry-run
```

### KV provisioning command

```bash
cd packages/worker
wrangler kv namespace create GEOCODING_KV --update-config --binding GEOCODING_KV
wrangler kv namespace create RATE_LIMIT_KV --update-config --binding RATE_LIMIT_KV
```

## 5. Acceptance Criteria

- **AC-001**: Given a fresh clone with no Cloudflare auth, When `pnpm -F @tcg/worker build` runs, Then it exits successfully.
- **AC-002**: Given `wrangler.jsonc`, When Wrangler v4 validates it, Then no schema errors are reported.
- **AC-003**: Given a developer runs `wrangler kv namespace create --update-config`, Then `wrangler.jsonc` is updated with real KV IDs.
- **AC-004**: Given the placeholder IDs are still present, When `wrangler deploy` is attempted, Then it fails with a clear namespace-not-found error rather than a cryptic validation error.

## 6. Test Automation Strategy

- **Test Levels**: Build verification (no unit tests required).
- **CI/CD Integration**: `pnpm -F @tcg/worker build` must pass in CI.
- **Coverage Requirements**: Not applicable for configuration.

## 7. Rationale & Context

The original `wrangler.jsonc` used an unsupported top-level `routing` field and empty strings for KV IDs. Wrangler v3/v4 rejected empty KV IDs during `wrangler deploy --dry-run`, making the build fail before any code was validated. Upgrading to Wrangler v4 and using descriptive placeholders lets the build pass while still preventing accidental production deployment with fake IDs.

## 8. Dependencies & External Integrations

### Third-Party Services

- **SVC-001**: Cloudflare Workers + KV — runtime and storage for the Worker.

### Technology Platform Dependencies

- **PLT-001**: Wrangler v4 CLI.

## 9. Examples & Edge Cases

### Successful dry-run output

```
Total Upload: 1536.87 KiB / gzip: 289.05 KiB
Your Worker has access to the following bindings:
env.GEOCODING_KV (__SET_GEOCODING_KV_ID_BEFORE_DEPLOY__)   KV Namespace
env.RATE_LIMIT_KV (__SET_RATE_LIMIT_KV_ID_BEFORE_DEPLOY__) KV Namespace
--dry-run: exiting now.
```

### Edge cases

- No Cloudflare auth: dry-run still passes because it only validates config and bundles code.
- Real IDs already set: dry-run uses them and would proceed to actual deploy if `--dry-run` were removed.
- Missing `id` field entirely: Wrangler rejects the config, which is why placeholders are required.

## 10. Validation Criteria

- `pnpm -F @tcg/worker build` succeeds from a clean environment.
- `pnpm lint` passes.

## 11. Related Specifications / Further Reading

- [spec-020-operations-setup.md](./spec-020-operations-setup.md)
- [Wrangler configuration docs](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Wrangler KV namespace commands](https://developers.cloudflare.com/workers/wrangler/commands/kv/)
