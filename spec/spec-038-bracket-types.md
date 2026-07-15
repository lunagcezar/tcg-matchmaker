---
title: Bracket Types — Round Robin, Swiss, Pool Play, Double Elimination
version: 1.0
date_created: 2026-07-14
tags: worker, tournaments, brackets, tdd
---

# Introduction

This specification adds bracket generation for the remaining tournament types and the organizer match result UI. Only single elimination was implemented; this adds the other four bracket types.

## 1. Scope

**Worker:**

- Round Robin generator (each player plays every other once)
- Swiss system generator (paired by record each round)
- Pool Play generator (groups → single elimination knockout)
- Double Elimination generator (winners + losers brackets)
- Route start to correct generator based on `bracket_type`

**Frontend:**

- ManagePage: match result reporting UI for organizers
- Bracket type routing on start

## 2. Bracket Types

| Type               | Strategy                                                       |
| ------------------ | -------------------------------------------------------------- |
| Round Robin        | Single round of every-player vs every-other, standings by wins |
| Swiss              | 4-7 rounds, paired by similar record each round                |
| Pool Play          | Groups → top N advance to single elimination                   |
| Double Elimination | Winners bracket + losers bracket, grand final                  |
