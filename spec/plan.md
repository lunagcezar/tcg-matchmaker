# Plan — spec-008: Tournaments API

## Summary

Implement tournament CRUD, registration, bracket generation, and match advancement following TDD.

## Implementation Order

```
     ┌──────────────────────────────┐
     │  Write failing tests (RED)   │
     └─────────────┬────────────────┘
                   │
     ┌─────────────▼────────────────┐
     │  Tournament routes           │  create, list, get, update,
     │  (tournaments/index.ts)      │  publish, cancel, register, check-in
     └─────────────┬────────────────┘
                   │
     ┌─────────────▼────────────────┐
     │  Start + bracket generation  │  generate single-elimination rounds
     │  + bracket-matches routes    │  report, walkover, advance
     └─────────────┬────────────────┘
                   │
     ┌─────────────▼────────────────┐
     │  Mount + verify              │  app.route + tests + tsc
     └──────────────────────────────┘
```

## Test Seams

| Seam              | What it tests                                            |
| ----------------- | -------------------------------------------------------- |
| Tournament create | 401 without auth, 201 with valid data                    |
| Publish           | Status change from draft to open                         |
| Register          | Participant added with pending status                    |
| Start             | Bracket rounds + matches generated, status = in_progress |
| Bracket           | Returns rounds with nested matches                       |
| Report match      | Winner recorded, advances to next match                  |
| Walkover          | Walkover status set, winner advances                     |

## Bracket Generation (Single Elimination)

Round 1: pair up checked-in participants randomly. If odd number, one gets a bye.
Round N: winner of each match advances to next_match_id / next_match_player_slot.
Final match: winner is tournament champion.
