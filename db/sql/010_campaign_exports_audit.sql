@'
-- 010_campaign_exports_audit.sql
CREATE SCHEMA IF NOT EXISTS campaign;

-- Export runs
CREATE TABLE IF NOT EXISTS campaign.exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  export_type campaign.export_type NOT NULL,
  export_format campaign.export_format NOT NULL,

  date_range_start date NOT NULL,
  date_range_end date NOT NULL,

  record_count int NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,

  export_hash text NOT NULL, -- sha256 over canonical export payload
  generated_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

CREATE INDEX IF NOT EXISTS idx_campaign_exports_generated_at ON campaign.exports(generated_at);

-- Audit log (minimal but critical)
CREATE TABLE IF NOT EXISTS campaign.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,               -- e.g., CREATE_CONTRIBUTION, UPDATE_EXPENSE, COMMIT_TRAVEL, EXPORT
  entity_type text NOT NULL,          -- contributions | expenses | travel_trips | exports | settings
  entity_id text,                     -- uuid or singleton
  before_state jsonb,
  after_state jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_audit_created ON campaign.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_audit_entity ON campaign.audit_log(entity_type, entity_id);
'@ | Set-Content -Encoding UTF8 "db/sql/010_campaign_exports_audit.sql"
