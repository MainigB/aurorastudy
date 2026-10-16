CREATE TABLE IF NOT EXISTS aurora_admins (
 user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
 granted_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS aurora_admin_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_id text REFERENCES "user"(id) ON DELETE SET NULL,
 target_id text REFERENCES "user"(id) ON DELETE SET NULL,
 action text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
