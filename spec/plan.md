# Plan — spec-006: Game Stores API

## Summary

Implement store CRUD, membership management, and admin operations following TDD (test-first).

## Implementation Order

```
     ┌─────────────────────┐
     │  Write failing test │  (1) TDD RED — tests for store routes
     │  (test first)       │      tests for membership routes
     └──────────┬──────────┘
                │
     ┌──────────▼──────────┐
     │  Shared schema      │  (2) Add UpdateStoreSchema
     │  updates             │
     └──────────┬──────────┘
                │
     ┌──────────▼──────────┐
     │  Implement routes   │  (3) TDD GREEN — stores/index.ts
     │  + middleware        │      store membership logic
     └──────────┬──────────┘
                │
     ┌──────────▼──────────┐
     │  Mount + verify     │  (4) Mount in index.ts
     │                     │      Run tests + tsc
     └─────────────────────┘
```

## Test Seams

| Seam | What it tests | Mock boundary |
|------|--------------|---------------|
| Store list/get | Public reads return correct data | `@supabase/supabase-js` — mock from().select().is().order() |
| Store create | Auth guard + creation + owner membership | Mock from().insert().select().single() |
| Store update | Owner/manager guard | Mock from().select().eq().single() for membership check |
| Store delete | Admin guard | Mock with auth middleware |
| Membership | Add/remove/role checks | Mock from() chains for membership queries |

## Key Decisions

1. **Slug auto-generation**: Use `name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")` truncated to 100 chars.
2. **Membership checks**: Before every member-only operation, query `store_memberships` for the current user's role.
3. **Owner protection**: `DELETE /members/:userId` blocks removing the last owner.
