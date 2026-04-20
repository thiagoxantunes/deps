-- Landing page configuration table
CREATE TABLE IF NOT EXISTS landing_config (
  id integer PRIMARY KEY DEFAULT 1,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE landing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read landing config"
  ON landing_config FOR SELECT TO public USING (true);

CREATE POLICY "Anon can update landing config"
  ON landing_config FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Auth can update landing config"
  ON landing_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
