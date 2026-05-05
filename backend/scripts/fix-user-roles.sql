-- =====================================================
-- Script para corrigir role_id de usuários existentes
-- =====================================================
-- Execute este script para garantir que todos os usuários
-- tenham um role_id configurado baseado em tipo_usuario
-- =====================================================

-- 1. Verificar quantos usuários não têm role_id
SELECT
    COUNT(*) as usuarios_sem_role,
    tipo_usuario
FROM usuario
WHERE role_id IS NULL
GROUP BY tipo_usuario;

-- 2. Atualizar usuários admin sem role_id
UPDATE usuario
SET role_id = (SELECT id FROM roles WHERE nome = 'SuperAdmin')
WHERE tipo_usuario = 'admin' AND role_id IS NULL;

-- 3. Atualizar usuários bibliotecario sem role_id
UPDATE usuario
SET role_id = (SELECT id FROM roles WHERE nome = 'Bibliotecário Sênior')
WHERE tipo_usuario = 'bibliotecario' AND role_id IS NULL;

-- 4. Atualizar usuários aluno sem role_id
UPDATE usuario
SET role_id = (SELECT id FROM roles WHERE nome = 'Aluno')
WHERE tipo_usuario = 'aluno' AND role_id IS NULL;

-- 5. Verificar resultado
SELECT
    u.id,
    u.nome,
    u.email,
    u.tipo_usuario,
    r.nome as role_nome
FROM usuario u
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY u.tipo_usuario, u.nome;
