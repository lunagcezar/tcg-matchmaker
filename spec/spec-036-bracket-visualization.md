---
title: Bracket Visualization (D3.js)
version: 1.0
date_created: 2026-07-15
tags: frontend, d3, tournament, visualization
---

# Bracket Visualization (D3.js)

## 1. Purpose & Scope

Implement an SVG-based bracket visualization composable using D3.js (`useBracketD3`) that renders single-elimination tournament brackets. The composable accepts a container ref and reactive match data, then renders rounds as columns with player names, winner highlighting, and connector lines between rounds.

## 2. Definitions

| Term         | Definition                                                               |
| ------------ | ------------------------------------------------------------------------ |
| BracketMatch | Interface with id, round, player1, player2, winner, score1, score2       |
| Round        | A column in the bracket showing all matches at the same tournament stage |

## 3. Requirements, Constraints & Guidelines

- **REQ-001**: `useBracketD3` is a Vue composable that accepts `containerRef: Ref<HTMLElement | null>` and `matches: Ref<BracketMatch[]>``
- **REQ-002**: On mount and whenever data changes, the composable renders an SVG inside the container element
- **REQ-003**: Each round is rendered as a vertical column of match boxes
- **REQ-004**: Each match box shows player1 name (top) and player2 name (bottom), centered
- **REQ-005**: Winner names are rendered in bold font-weight
- **REQ-006**: Completed matches (have a winner) have a green background (`#e8f5e9`)
- **REQ-007**: Pending matches have a light grey background (`#f5f5f5`)
- **REQ-008**: Connector lines connect matches across rounds to show advancement paths
- **REQ-009**: Round labels ("Round 1", "Round 2", etc.) appear above each column
- **REQ-010**: TBD (to be determined) is shown when a player slot is null
- **REQ-011**: Uses a reactive `watch` with `{ immediate: true, deep: true }` to re-render on data or container changes
- **CON-001**: Uses D3.js library (already in project dependencies)
- **CON-002**: SVG size adapts to container width; height is based on match count

## 4. Interfaces

```ts
interface BracketMatch {
  id: string;
  round: number;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  score1?: number;
  score2?: number;
}
```

## 5. Acceptance Criteria

- **AC-001**: Given a tournament bracket with 4 matches across 2 rounds, When the composable renders, Then an SVG is created with two columns of match boxes
- **AC-002**: Given a match has a winner, When rendered, Then the winner's name is bold and the box has a green background
- **AC-003**: Given a match has no winner yet, When rendered, Then the box has a grey background
- **AC-004**: Given a player slot is empty, When rendered, Then "TBD" is displayed
- **AC-005**: Given the match data updates, When the composable's watch triggers, Then the SVG refreshes to reflect the new data
- **AC-006**: Given the container element changes size, When the composable re-renders, Then the SVG dimensions adapt

## 6. Dependencies

- D3.js (`d3`) library
- Tournament detail/manage pages for data source
- Bracket format: single elimination (other bracket types use the same composable with round number mapping)
