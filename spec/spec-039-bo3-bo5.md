---
title: BO3/BO5 Support — Best-of Match Format
version: 1.0
date_created: 2026-07-14
tags: worker, frontend, tournaments, brackets
---

# Introduction

This specification adds best-of (BO3/BO5) support to tournaments. The `best_of` field determines how many games a match requires to win. Scores are validated against the best-of limit.

## 1. Scope

- Shared schema: add `best_of` to CreateEventSchema and EventSchema
- Migration: add `best_of` column to events table
- Worker: validate scores against best_of on report, pass to bracket
- Frontend: CreatePage selector, ManagePage score inputs, D3 score display
