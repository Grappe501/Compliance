@'
-- 007_campaign_contrib.sql
CREATE SCHEMA IF NOT EXISTS campaign;

-- Contacts
CREATE TABLE IF NOT EXISTS campaign.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type campaign.contact_type NOT NULL,
  first_name text,
  middle_name text,
  last_name text,
  suffix text,
  org_name text,

  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,

  phone text,
  email text,

  employer text,
  occupation text,
  occupation_other text,

  external_contributor_id text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contributions
CREATE TABLE IF NOT EXISTS campaign.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  contribution_date date NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),

  contribution_type text NOT NULL,
  election_type text NOT NULL,
  contributor_type text NOT NULL,

  description text,

  status campaign.record_status NOT NULL DEFAULT 'draft',
  source campaign.source NOT NULL DEFAULT 'manual',
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,

  contact_id uuid NOT NULL REFERENCES campaign.contacts(id) ON DELETE RESTRICT,

  external_contribution_id text NOT NULL UNIQUE,
  filing_entity_id text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contribution Returns (optional in MVP UI, required for schema completeness)
CREATE TABLE IF NOT EXISTS campaign.contribution_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  external_return_contribution_id text NOT NULL UNIQUE,
  external_contribution_id text NOT NULL REFERENCES campaign.contributions(external_contribution_id) ON DELETE RESTRICT,

  contribution_return_date date NOT NULL,
  contribution_return_amount numeric(12,2) NOT NULL CHECK (contribution_return_amount >= 0),
  contribution_return_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_org_name ON campaign.contacts (org_name);
CREATE INDEX IF NOT EXISTS idx_contacts_last_first ON campaign.contacts (last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_contrib_date ON campaign.contributions (contribution_date);
CREATE INDEX IF NOT EXISTS idx_contrib_status ON campaign.contributions (status);
CREATE INDEX IF NOT EXISTS idx_contrib_contact_id ON campaign.contributions (contact_id);

-- updated_at triggers (if not already created in phase 1, create helper function)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at' AND pg_namespace::regnamespace::text = 'campaign') THEN
    CREATE OR REPLACE FUNCTION campaign.set_updated_at()
    RETURNS TRIGGER AS $fn$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contacts_updated_at') THEN
    CREATE TRIGGER trg_contacts_updated_at
    BEFORE UPDATE ON campaign.contacts
    FOR EACH ROW EXECUTE FUNCTION campaign.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contrib_updated_at') THEN
    CREATE TRIGGER trg_contrib_updated_at
    BEFORE UPDATE ON campaign.contributions
    FOR EACH ROW EXECUTE FUNCTION campaign.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_contrib_returns_updated_at') THEN
    CREATE TRIGGER trg_contrib_returns_updated_at
    BEFORE UPDATE ON campaign.contribution_returns
    FOR EACH ROW EXECUTE FUNCTION campaign.set_updated_at();
  END IF;
END $$;
'@ | Set-Content -Encoding UTF8 "db/sql/007_campaign_contrib.sql"
