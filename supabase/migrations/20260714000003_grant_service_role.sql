-- Grant table-level permissions to service_role (used by Hono Worker secret key).
-- RLS is bypassed via the secret key, but PostgreSQL still requires explicit
-- INSERT/SELECT/UPDATE/DELETE grants at the table level.

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
