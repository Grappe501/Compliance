-- db/sql/006_campaign_schema.sql
-- Phase 1: campaign schema + core enums + settings singleton table
-- Must be idempotent (safe to run multiple times)

-- Ensure crypto functions exist (for gen_random_uuid in later phases)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Schema
CREATE SCHEMA IF NOT EXISTS campaign;

-- =========================
-- Enum Types (idempotent)
-- =========================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'record_status' AND n.nspname = 'campaign'
  ) THEN
    CREATE TYPE campaign.record_status AS ENUM ('draft', 'ready', 'flagged');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'travel_status' AND n.nspname = 'campaign'
  ) THEN
    CREATE TYPE campaign.travel_status AS ENUM ('draft', 'ready', 'flagged', 'committed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'source' AND n.nspname = 'campaign'
  ) THEN
    CREATE TYPE campaign.source AS ENUM ('manual', 'travel', 'import');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'contact_type' AND n.nspname = 'campaign'
  ) THEN
    CREATE TYPE campaign.contact_type AS ENUM ('person', 'organization');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'export_format' AND n.nspname = 'campaign'
  ) THEN
    CREATE TYPE campaign.export_format AS ENUM ('csv', 'html');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'export_type' AND n.nspname = 'campaign'
  ) THEN
    CREATE TYPE campaign.export_type AS ENUM ('contributions', 'expenditures', 'both');
  END IF;
END $$;

-- =========================
-- Settings singleton table
-- =========================

CREATE TABLE IF NOT EXISTS campaign.settings (
  id text PRIMARY KEY,

  sos_filing_entity_id text,
  sos_filing_entity_name text,

  timezone text NOT NULL DEFAULT 'America/Chicago',
  default_election_type text,

  mileage_rate numeric(6,2) NOT NULL DEFAULT 0.70,

  brand_primary text,
  brand_secondary text,
  brand_logo_url text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful updated_at trigger function in campaign schema (reused later)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'set_updated_at' AND n.nspname = 'campaign'
  ) THEN
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
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_campaign_settings_updated_at'
  ) THEN
    CREATE TRIGGER trg_campaign_settings_updated_at
    BEFORE UPDATE ON campaign.settings
    FOR EACH ROW EXECUTE FUNCTION campaign.set_updated_at();
  END IF;
END $$;

-- Ensure singleton row exists (idempotent)
INSERT INTO campaign.settings (id)
VALUES ('singleton')
ON CONFLICT (id) DO NOTHING;
