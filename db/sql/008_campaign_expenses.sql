@'
-- 008_campaign_expenses.sql
CREATE SCHEMA IF NOT EXISTS campaign;

-- Expenses
CREATE TABLE IF NOT EXISTS campaign.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  expenditure_date date NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),

  expenditure_type text NOT NULL,
  election_type text,

  expenditure_category text NOT NULL,
  expenditure_category_other_description text,

  -- SOS fields / mapping helpers
  payee_type text,                  -- PERSON | ORGANIZATION (kept as text to match SOS dropdowns)
  external_payee_id text,           -- optional SOS external payee id
  filing_entity_id text,            -- pulled from settings on export

  description text,

  status campaign.record_status NOT NULL DEFAULT 'draft',
  source campaign.source NOT NULL DEFAULT 'manual',
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,

  contact_id uuid REFERENCES campaign.contacts(id) ON DELETE SET NULL,

  external_expenditure_id text UNIQUE, -- generated once on create

  linked_travel_trip_id uuid,          -- set when source='travel'

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Update timestamp trigger (reuse pattern if repo already has one; otherwise create a local one)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at_campaign') THEN
    CREATE FUNCTION set_updated_at_campaign()
    RETURNS trigger AS $f$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END
    $f$ LANGUAGE plpgsql;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tg_campaign_expenses_updated_at'
  ) THEN
    CREATE TRIGGER tg_campaign_expenses_updated_at
    BEFORE UPDATE ON campaign.expenses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_campaign();
  END IF;
END $$;

-- Expenditure returns (future SOS sheet; minimal now)
CREATE TABLE IF NOT EXISTS campaign.expenditure_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  external_return_expenditure_id text UNIQUE,
  external_expenditure_id text NOT NULL,

  expenditure_return_date date NOT NULL,
  expenditure_return_amount numeric(12,2) NOT NULL CHECK (expenditure_return_amount >= 0),
  expenditure_return_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tg_campaign_expenditure_returns_updated_at'
  ) THEN
    CREATE TRIGGER tg_campaign_expenditure_returns_updated_at
    BEFORE UPDATE ON campaign.expenditure_returns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_campaign();
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_expenses_date ON campaign.expenses(expenditure_date);
CREATE INDEX IF NOT EXISTS idx_campaign_expenses_status ON campaign.expenses(status);
CREATE INDEX IF NOT EXISTS idx_campaign_expenses_category ON campaign.expenses(expenditure_category);
CREATE INDEX IF NOT EXISTS idx_campaign_expenses_type ON campaign.expenses(expenditure_type);
CREATE INDEX IF NOT EXISTS idx_campaign_expenses_contact ON campaign.expenses(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_expenses_source ON campaign.expenses(source);
'@ | Set-Content -Encoding UTF8 "db/sql/008_campaign_expenses.sql"
