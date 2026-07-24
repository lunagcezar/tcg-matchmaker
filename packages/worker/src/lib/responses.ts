import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export function result<T>(
  c: Context,
  payload: { data: T | null; error: string | null; meta: unknown | null },
  status: ContentfulStatusCode = 200,
) {
  return c.json(payload, status);
}

export function ok<T>(c: Context, data: T, meta: unknown | null = null) {
  return c.json({ data, error: null, meta }, 200);
}

export function created<T>(c: Context, data: T) {
  return c.json({ data, error: null, meta: null }, 201);
}

export function badRequest(c: Context, error: string) {
  return c.json({ data: null, error, meta: null }, 400);
}

export function unauthorized(c: Context, error = 'Unauthorized') {
  return c.json({ data: null, error, meta: null }, 401);
}

export function forbidden(c: Context, error = 'Forbidden') {
  return c.json({ data: null, error, meta: null }, 403);
}

export function notFound(c: Context, error = 'Not found') {
  return c.json({ data: null, error, meta: null }, 404);
}

export function tooManyRequests(c: Context, error = 'Too many requests. Try again later.') {
  return c.json({ data: null, error, meta: null }, 429);
}

export function serverError(c: Context, error = 'Internal server error') {
  return c.json({ data: null, error, meta: null }, 500);
}
