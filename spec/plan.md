# Plan — spec-004: TCGs & Formats API

## Summary

Implement the TCG and Format management API routes. Admin-only write, public read. Uses the existing auth middleware plus a new admin role check.

## Implementation Order

```
         ┌──────────────────────────┐
         │  Admin middleware        │  (1) Simple role check
         │  (middleware/admin.ts)   │
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  Shared schema updates   │  (2) UpdateTcgSchema, UpdateFormatSchema
         │  (tcg.ts)                │
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  TCG routes + format     │  (3) tcgs/index.ts — both routers
         │  routers (tcgs/index.ts) │
         └───────────┬──────────────┘
                     │
         ┌───────────▼──────────────┐
         │  Mount in index.ts       │  (4) app.route("/api/tcgs", tcgRouter)
         │                          │      app.route("/api/formats", formatRouter)
         └──────────────────────────┘
```

## Parallelizable Blocks

| Block | Items | Dependencies |
|-------|-------|-------------|
| A | Admin middleware | None |
| B | Shared schema update | None |
| C | TCG + format routes | A, B |
| D | Mount routes | C |
