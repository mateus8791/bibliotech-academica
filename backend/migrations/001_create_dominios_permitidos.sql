-- Migration: Criar tabela de domínios permitidos para login Google
-- Arquivo: backend/migrations/001_create_dominios_permitidos.sql

-- Tabela para armazenar os domínios institucionais permitidos
CREATE TABLE IF NOT EXISTS dominios_permitidos (
  id SERIAL PRIMARY KEY,
  dominio VARCHAR(255) NOT NULL UNIQUE,
  descricao VARCHAR(500),
  ativo BOOLEAN DEFAULT true,
  criado_por UUID REFERENCES usuario(id),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida por domínio
CREATE INDEX idx_dominio ON dominios_permitidos(dominio);

-- Índice para busca de domínios ativos
CREATE INDEX idx_dominio_ativo ON dominios_permitidos(ativo);

-- Comentários para documentação
COMMENT ON TABLE dominios_permitidos IS 'Armazena os domínios de e-mail institucionais permitidos para login via Google OAuth';
COMMENT ON COLUMN dominios_permitidos.dominio IS 'Domínio no formato @instituicao.edu.br';
COMMENT ON COLUMN dominios_permitidos.descricao IS 'Descrição da instituição ou propósito do domínio';
COMMENT ON COLUMN dominios_permitidos.ativo IS 'Indica se o domínio está atualmente permitido para login';

-- Inserir domínio padrão (exemplo - você pode alterar depois)
-- INSERT INTO dominios_permitidos (dominio, descricao, ativo)
-- VALUES ('@fatec.sp.gov.br', 'Faculdade de Tecnologia do Estado de São Paulo', true);
