-- =====================================================
-- MIGRAÇÃO 003: Sistema RBAC (Role-Based Access Control)
-- =====================================================
-- Autor: Claude Code
-- Data: 2025-11-10
-- Descrição: Cria sistema de permissões granulares
--            substituindo o tipo_usuario simples
-- =====================================================

-- 1. TABELA DE PERMISSÕES
-- Define as ações que podem ser executadas no sistema
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,  -- Ex: 'can_block_user', 'can_view_logs'
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50),               -- Ex: 'usuarios', 'livros', 'sistema'
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida por código
CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_categoria ON permissions(categoria);

-- 2. TABELA DE ROLES (GRUPOS DE PERMISSÃO)
-- Define grupos com conjuntos específicos de permissões
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,   -- Ex: 'Bibliotecário Júnior'
    descricao TEXT,
    is_system_role BOOLEAN DEFAULT FALSE, -- Roles do sistema não podem ser deletadas
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida
CREATE INDEX idx_roles_nome ON roles(nome);
CREATE INDEX idx_roles_ativo ON roles(ativo);

-- 3. TABELA ASSOCIATIVA: PERMISSÕES <-> ROLES
-- Relacionamento muitos-para-muitos
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)  -- Previne duplicatas
);

-- Índices para consultas rápidas
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- 4. ALTERAR TABELA DE USUÁRIOS
-- Adiciona campos para o novo sistema RBAC
ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES usuario(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS blocked_reason TEXT NULL,
    ADD COLUMN IF NOT EXISTS telefone VARCHAR(20) NULL;  -- Para WhatsApp

-- Índices
CREATE INDEX idx_usuario_role ON usuario(role_id);
CREATE INDEX idx_usuario_blocked ON usuario(is_blocked);

-- =====================================================
-- DADOS INICIAIS: PERMISSÕES DO SISTEMA
-- =====================================================

INSERT INTO permissions (code, nome, descricao, categoria) VALUES
-- GESTÃO DE UTILIZADORES
('can_view_users', 'Visualizar Utilizadores', 'Pode ver a lista de utilizadores', 'usuarios'),
('can_create_user', 'Criar Utilizador', 'Pode criar novos utilizadores', 'usuarios'),
('can_edit_user', 'Editar Utilizador', 'Pode editar dados de utilizadores', 'usuarios'),
('can_delete_user', 'Deletar Utilizador', 'Pode remover utilizadores do sistema', 'usuarios'),
('can_block_user', 'Bloquear Utilizador', 'Pode bloquear/desbloquear utilizadores', 'usuarios'),
('can_assign_role', 'Atribuir Grupo', 'Pode atribuir roles a utilizadores', 'usuarios'),
('can_notify_user', 'Notificar Utilizador', 'Pode enviar notificações manuais', 'usuarios'),

-- GESTÃO DE LIVROS
('can_view_books', 'Visualizar Livros', 'Pode ver o catálogo de livros', 'livros'),
('can_create_book', 'Criar Livro', 'Pode adicionar novos livros', 'livros'),
('can_edit_book', 'Editar Livro', 'Pode editar informações de livros', 'livros'),
('can_delete_book', 'Deletar Livro', 'Pode remover livros do acervo', 'livros'),
('can_import_books', 'Importar Livros', 'Pode fazer importação em lote (CSV)', 'livros'),

-- GESTÃO DE EMPRÉSTIMOS
('can_view_loans', 'Visualizar Empréstimos', 'Pode ver empréstimos', 'emprestimos'),
('can_create_loan', 'Criar Empréstimo', 'Pode registrar empréstimos', 'emprestimos'),
('can_approve_loan', 'Aprovar Empréstimo', 'Pode aprovar pedidos de empréstimo', 'emprestimos'),
('can_return_book', 'Registrar Devolução', 'Pode registrar devoluções', 'emprestimos'),

-- GESTÃO DE RESERVAS
('can_view_reservations', 'Visualizar Reservas', 'Pode ver reservas', 'reservas'),
('can_create_reservation', 'Criar Reserva', 'Pode fazer reservas de livros', 'reservas'),
('can_cancel_reservation', 'Cancelar Reserva', 'Pode cancelar reservas', 'reservas'),

-- ADMINISTRAÇÃO DO SISTEMA
('can_view_logs', 'Visualizar Logs', 'Pode acessar logs de auditoria', 'sistema'),
('can_manage_roles', 'Gerenciar Permissões', 'Pode criar e editar grupos de permissão', 'sistema'),
('can_view_dashboard', 'Ver Dashboard Admin', 'Acesso ao painel administrativo', 'sistema'),
('can_manage_domains', 'Gerenciar Domínios', 'Pode gerenciar domínios permitidos', 'sistema'),
('can_view_reports', 'Visualizar Relatórios', 'Pode acessar relatórios do sistema', 'sistema'),
('can_manage_categories', 'Gerenciar Categorias', 'Pode criar/editar categorias', 'sistema'),
('can_manage_authors', 'Gerenciar Autores', 'Pode criar/editar autores', 'sistema')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- DADOS INICIAIS: ROLES DO SISTEMA
-- =====================================================

-- Role 1: SUPERADMIN (Acesso Total)
INSERT INTO roles (nome, descricao, is_system_role, ativo)
VALUES ('SuperAdmin', 'Administrador com acesso total ao sistema', TRUE, TRUE)
ON CONFLICT (nome) DO NOTHING;

-- Role 2: BIBLIOTECÁRIO SÊNIOR
INSERT INTO roles (nome, descricao, is_system_role, ativo)
VALUES ('Bibliotecário Sênior', 'Gestão completa de acervo, empréstimos e utilizadores', TRUE, TRUE)
ON CONFLICT (nome) DO NOTHING;

-- Role 3: BIBLIOTECÁRIO JÚNIOR
INSERT INTO roles (nome, descricao, is_system_role, ativo)
VALUES ('Bibliotecário Júnior', 'Operações básicas de empréstimo e consulta', TRUE, TRUE)
ON CONFLICT (nome) DO NOTHING;

-- Role 4: ALUNO
INSERT INTO roles (nome, descricao, is_system_role, ativo)
VALUES ('Aluno', 'Utilizador padrão com acesso de leitura e reservas', TRUE, TRUE)
ON CONFLICT (nome) DO NOTHING;

-- =====================================================
-- ATRIBUIR PERMISSÕES AOS ROLES
-- =====================================================

-- SUPERADMIN: TODAS AS PERMISSÕES
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE nome = 'SuperAdmin'),
    id
FROM permissions
ON CONFLICT DO NOTHING;

-- BIBLIOTECÁRIO SÊNIOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE nome = 'Bibliotecário Sênior'),
    id
FROM permissions
WHERE code IN (
    'can_view_users', 'can_create_user', 'can_edit_user', 'can_block_user',
    'can_view_books', 'can_create_book', 'can_edit_book', 'can_delete_book', 'can_import_books',
    'can_view_loans', 'can_create_loan', 'can_approve_loan', 'can_return_book',
    'can_view_reservations', 'can_cancel_reservation',
    'can_view_logs', 'can_view_dashboard', 'can_view_reports',
    'can_manage_categories', 'can_manage_authors'
)
ON CONFLICT DO NOTHING;

-- BIBLIOTECÁRIO JÚNIOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE nome = 'Bibliotecário Júnior'),
    id
FROM permissions
WHERE code IN (
    'can_view_users', 'can_view_books', 'can_view_loans', 'can_create_loan',
    'can_return_book', 'can_view_reservations', 'can_view_dashboard'
)
ON CONFLICT DO NOTHING;

-- ALUNO
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE nome = 'Aluno'),
    id
FROM permissions
WHERE code IN (
    'can_view_books', 'can_create_reservation', 'can_cancel_reservation'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- MIGRAR UTILIZADORES EXISTENTES PARA O NOVO SISTEMA
-- =====================================================

-- Atribuir roles baseados no tipo_usuario antigo
UPDATE usuario SET role_id = (SELECT id FROM roles WHERE nome = 'SuperAdmin')
WHERE tipo_usuario = 'admin' AND role_id IS NULL;

UPDATE usuario SET role_id = (SELECT id FROM roles WHERE nome = 'Bibliotecário Sênior')
WHERE tipo_usuario = 'bibliotecario' AND role_id IS NULL;

UPDATE usuario SET role_id = (SELECT id FROM roles WHERE nome = 'Aluno')
WHERE tipo_usuario = 'aluno' AND role_id IS NULL;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TABLE permissions IS 'Define todas as permissões disponíveis no sistema';
COMMENT ON TABLE roles IS 'Grupos de permissões que podem ser atribuídos a utilizadores';
COMMENT ON TABLE role_permissions IS 'Relacionamento muitos-para-muitos entre roles e permissions';
COMMENT ON COLUMN usuario.role_id IS 'Grupo de permissão atribuído ao utilizador';
COMMENT ON COLUMN usuario.is_blocked IS 'Indica se o utilizador está bloqueado pelo admin';
COMMENT ON COLUMN usuario.telefone IS 'Número de telefone para notificações via WhatsApp';

-- =====================================================
-- FIM DA MIGRAÇÃO 003
-- =====================================================
