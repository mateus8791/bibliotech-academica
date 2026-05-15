-- Migration: 011_create_integrations
-- Descrição: Armazena configurações de integrações com provedores externos.
-- api_key_encrypted: nunca armazenar em texto plano; usar encryptionService.js para gravar/ler.
-- library_id: NULL no MVP; preparado para arquitetura multi-tenant futura.
-- Criado em: 2026-05-01

CREATE TABLE IF NOT EXISTS integrations (
  id                SERIAL       PRIMARY KEY,
  library_id        INTEGER,     -- NULL no MVP (sem multi-tenant ainda); reservado para uso futuro
  provider          VARCHAR(30)  NOT NULL CHECK (provider IN ('openai', 'gemini', 'google_books')),
  api_key_encrypted TEXT,        -- AES-256-GCM; NUNCA armazenar em texto plano
  model             VARCHAR(60), -- ex: 'gpt-4o-mini', 'gemini-1.5-flash'
  enabled           BOOLEAN      NOT NULL DEFAULT FALSE,
  features_enabled  TEXT[]       DEFAULT '{}', -- ex: {'metadata_generation','cover_download'}
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT integrations_provider_library_unique UNIQUE (provider, library_id)
);

CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_integrations_updated_at ON integrations;

CREATE TRIGGER trigger_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_integrations_updated_at();
