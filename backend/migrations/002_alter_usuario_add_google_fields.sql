-- Migration: Adicionar campos para suporte ao login Google
-- Arquivo: backend/migrations/002_alter_usuario_add_google_fields.sql

-- Adicionar coluna para identificar se o usuário usa login Google
ALTER TABLE usuario
ADD COLUMN IF NOT EXISTS is_google_user BOOLEAN DEFAULT false;

-- Adicionar coluna para armazenar o Google ID do usuário
ALTER TABLE usuario
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Tornar senha_hash opcional para usuários Google (eles não precisam de senha)
ALTER TABLE usuario
ALTER COLUMN senha_hash DROP NOT NULL;

-- Índice para busca rápida por Google ID
CREATE INDEX IF NOT EXISTS idx_google_id ON usuario(google_id);

-- Comentários para documentação
COMMENT ON COLUMN usuario.is_google_user IS 'Indica se o usuário fez cadastro via Google OAuth';
COMMENT ON COLUMN usuario.google_id IS 'ID único do usuário no Google (usado para autenticação OAuth)';
