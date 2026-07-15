---
title: Deployment & Infrastructure — DB Types, Wrangler Config, CI/CD
version: 1.0
date_created: 2026-07-14
tags: infrastructure, deployment, wrangler, ci, cd
---

# Introduction

This specification completes the deployment infrastructure: database type generation, production Wrangler configuration, and CI/CD documentation.

## 1. Purpose & Scope

**Purpose:** Prepare the project for production deployment to Cloudflare Pages (frontend) and Cloudflare Workers (API).

**Scope:**

- Supabase database types generation script
- Wrangler production configuration
- Root script for type generation
- Deployment documentation in README

**Out of scope:**

- Actual deployment execution
- GitHub Actions workflow setup
- Domain/DNS configuration
- Supabase production project setup
