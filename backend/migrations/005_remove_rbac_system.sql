-- Migration para remover o sistema RBAC e voltar ao controle por tipo_usuario

-- Primeiro, vamos migrar os usuários de volta para tipo_usuario baseado em seus roles
UPDATE usuario
SET tipo_usuario = 'admin'
WHERE role_id IN (SELECT id FROM roles WHERE nome = 'SuperAdmin');

UPDATE usuario
SET tipo_usuario = 'bibliotecario'
WHERE role_id IN (SELECT id FROM roles WHERE nome IN ('Bibliotecário Sênior', 'Bibliotecário Júnior'));

UPDATE usuario
SET tipo_usuario = 'aluno'
WHERE role_id IN (SELECT id FROM roles WHERE nome = 'Aluno')
   OR role_id IS NULL;

-- Remover colunas relacionadas ao RBAC da tabela usuario
ALTER TABLE usuario
    DROP COLUMN IF EXISTS role_id,
    DROP COLUMN IF EXISTS is_blocked,
    DROP COLUMN IF EXISTS blocked_at,
    DROP COLUMN IF EXISTS blocked_by,
    DROP COLUMN IF EXISTS blocked_reason;

-- Remover tabelas do sistema RBAC na ordem correta (devido às foreign keys)
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

-- Garantir que tipo_usuario não seja NULL e tenha um valor padrão
ALTER TABLE usuario
    ALTER COLUMN tipo_usuario SET DEFAULT 'aluno',
    ALTER COLUMN tipo_usuario SET NOT NULL;

-- Criar índice em tipo_usuario para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_usuario_tipo ON usuario(tipo_usuario);

-- Comentários
COMMENT ON COLUMN usuario.tipo_usuario IS 'Tipo de usuário: admin, bibliotecario ou aluno';
