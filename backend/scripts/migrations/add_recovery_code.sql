-- Script para adicionar campo de código de recuperação na tabela usuario
-- Execute este script no seu banco de dados PostgreSQL

-- Adiciona o campo codigo_recuperacao (opcional, gerado pela organização)
ALTER TABLE usuario
ADD COLUMN IF NOT EXISTS codigo_recuperacao VARCHAR(100);

-- Comentário explicativo
COMMENT ON COLUMN usuario.codigo_recuperacao IS 'Código de recuperação fornecido pela organização para resetar senha';
