-- Scoring app KV store (edge function make-server-845a157a)
CREATE TABLE IF NOT EXISTS public.kv_store_845a157a (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

ALTER TABLE public.kv_store_845a157a ENABLE ROW LEVEL SECURITY;

-- No policies: only service_role (edge function) can access this table.
