-- =====================================================
-- MIGRAÇÃO 004: Sistema de Logs de Acesso e Auditoria
-- =====================================================
-- Autor: Claude Code
-- Data: 2025-11-10
-- Descrição: Cria sistema completo de monitoramento
--            de sessões e auditoria de acessos
-- =====================================================

-- 1. TABELA DE LOGS DE ACESSO (SESSÕES)
CREATE TABLE IF NOT EXISTS access_logs (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255),
    foto_url TEXT,

    -- Informações da Sessão
    login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_duration_seconds INTEGER NULL,  -- Calculado no logout/timeout

    -- Status do Acesso
    status VARCHAR(20) NOT NULL DEFAULT 'success',  -- 'success', 'failed', 'active', 'timeout'
    failure_reason VARCHAR(255) NULL,  -- Ex: 'dominio_invalido', 'conta_bloqueada'

    -- Informações Técnicas
    ip_address VARCHAR(45),  -- Suporta IPv4 e IPv6
    user_agent TEXT,
    browser VARCHAR(100),
    os VARCHAR(100),
    device_type VARCHAR(50),  -- 'desktop', 'mobile', 'tablet'

    -- Metadados
    is_active BOOLEAN DEFAULT TRUE,  -- TRUE enquanto a sessão está ativa
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas rápidas
CREATE INDEX idx_access_logs_usuario ON access_logs(usuario_id);
CREATE INDEX idx_access_logs_email ON access_logs(email);
CREATE INDEX idx_access_logs_login_time ON access_logs(login_time DESC);
CREATE INDEX idx_access_logs_status ON access_logs(status);
CREATE INDEX idx_access_logs_is_active ON access_logs(is_active);
CREATE INDEX idx_access_logs_last_seen ON access_logs(last_seen DESC);

-- Índice composto para queries de sessões ativas
CREATE INDEX idx_access_logs_active_sessions
ON access_logs(is_active, usuario_id, last_seen DESC)
WHERE is_active = TRUE;

-- 2. TABELA DE AUDITORIA DE AÇÕES
-- Registra todas as ações importantes dos administradores
CREATE TABLE IF NOT EXISTS audit_trail (
    id SERIAL PRIMARY KEY,

    -- Quem fez a ação
    usuario_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(255),
    usuario_email VARCHAR(255),
    usuario_role VARCHAR(100),

    -- O que foi feito
    action VARCHAR(100) NOT NULL,  -- Ex: 'block_user', 'create_book', 'delete_loan'
    categoria VARCHAR(50),  -- 'usuarios', 'livros', 'emprestimos', 'sistema'
    descricao TEXT NOT NULL,

    -- Onde foi feito
    target_type VARCHAR(50),  -- Ex: 'usuario', 'livro', 'emprestimo'
    target_id INTEGER,
    target_info JSONB,  -- Dados do alvo da ação

    -- Informações adicionais
    ip_address VARCHAR(45),
    old_value JSONB,  -- Valor anterior (para updates)
    new_value JSONB,  -- Novo valor

    -- Metadados
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para auditoria
CREATE INDEX idx_audit_usuario ON audit_trail(usuario_id);
CREATE INDEX idx_audit_action ON audit_trail(action);
CREATE INDEX idx_audit_categoria ON audit_trail(categoria);
CREATE INDEX idx_audit_criado ON audit_trail(criado_em DESC);
CREATE INDEX idx_audit_target ON audit_trail(target_type, target_id);

-- Índice GIN para busca no JSON
CREATE INDEX idx_audit_target_info ON audit_trail USING GIN(target_info);

-- 3. TABELA DE NOTIFICAÇÕES ENVIADAS
-- Rastreia todas as notificações manuais enviadas por admins
CREATE TABLE IF NOT EXISTS notifications_sent (
    id SERIAL PRIMARY KEY,

    -- Remetente (Admin)
    enviado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    enviado_por_nome VARCHAR(255),
    enviado_por_email VARCHAR(255),

    -- Destinatário
    destinatario_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    destinatario_nome VARCHAR(255),
    destinatario_email VARCHAR(255),
    destinatario_telefone VARCHAR(20),

    -- Notificação
    tipo VARCHAR(20) NOT NULL,  -- 'email', 'whatsapp', 'sistema'
    assunto VARCHAR(255),  -- Para email
    mensagem TEXT NOT NULL,

    -- Status de Entrega
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'sent', 'delivered', 'failed'
    erro TEXT NULL,
    enviado_em TIMESTAMP NULL,
    entregue_em TIMESTAMP NULL,

    -- Metadados
    n8n_webhook_id VARCHAR(255) NULL,  -- ID do workflow n8n
    external_id VARCHAR(255) NULL,  -- ID externo (SendGrid, n8n, etc.)
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para notificações
CREATE INDEX idx_notifications_enviado_por ON notifications_sent(enviado_por);
CREATE INDEX idx_notifications_destinatario ON notifications_sent(destinatario_id);
CREATE INDEX idx_notifications_tipo ON notifications_sent(tipo);
CREATE INDEX idx_notifications_status ON notifications_sent(status);
CREATE INDEX idx_notifications_criado ON notifications_sent(criado_em DESC);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualização automática
CREATE TRIGGER trigger_access_logs_updated
    BEFORE UPDATE ON access_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trigger_notifications_updated
    BEFORE UPDATE ON notifications_sent
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- =====================================================
-- VIEWS ÚTEIS PARA CONSULTAS
-- =====================================================

-- View: Sessões Ativas Atualmente
CREATE OR REPLACE VIEW vw_active_sessions AS
SELECT
    al.id,
    al.usuario_id,
    al.nome,
    al.email,
    al.foto_url,
    al.login_time,
    al.last_seen,
    al.ip_address,
    al.browser,
    al.os,
    al.device_type,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - al.login_time))::INTEGER AS duracao_segundos,
    CASE
        WHEN al.last_seen > CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN 'online'
        WHEN al.last_seen > CURRENT_TIMESTAMP - INTERVAL '30 minutes' THEN 'idle'
        ELSE 'offline'
    END AS presence_status
FROM access_logs al
WHERE al.is_active = TRUE
  AND al.status = 'success'
ORDER BY al.last_seen DESC;

-- View: Estatísticas de Login por Dia
CREATE OR REPLACE VIEW vw_login_stats_daily AS
SELECT
    DATE(login_time) AS data,
    COUNT(*) AS total_logins,
    COUNT(DISTINCT usuario_id) AS usuarios_unicos,
    COUNT(*) FILTER (WHERE status = 'success') AS logins_sucesso,
    COUNT(*) FILTER (WHERE status = 'failed') AS logins_falha,
    AVG(session_duration_seconds) FILTER (WHERE session_duration_seconds IS NOT NULL) AS duracao_media_segundos
FROM access_logs
GROUP BY DATE(login_time)
ORDER BY data DESC;

-- View: Últimas Ações de Auditoria
CREATE OR REPLACE VIEW vw_recent_audit AS
SELECT
    at.id,
    at.usuario_nome,
    at.usuario_email,
    at.action,
    at.categoria,
    at.descricao,
    at.target_type,
    at.target_id,
    at.criado_em,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - at.criado_em))::INTEGER AS segundos_atras
FROM audit_trail at
ORDER BY at.criado_em DESC
LIMIT 100;

-- =====================================================
-- FUNÇÃO: Calcular Duração de Sessão
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.logout_time IS NOT NULL THEN
        NEW.session_duration_seconds = EXTRACT(EPOCH FROM (NEW.logout_time - NEW.login_time))::INTEGER;
        NEW.is_active = FALSE;
    ELSIF NEW.last_seen IS NOT NULL THEN
        -- Se last_seen está há mais de 10 minutos, considera timeout
        IF NEW.last_seen < CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN
            NEW.session_duration_seconds = EXTRACT(EPOCH FROM (NEW.last_seen - NEW.login_time))::INTEGER;
            NEW.status = 'timeout';
            NEW.is_active = FALSE;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular duração automaticamente
CREATE TRIGGER trigger_calculate_session_duration
    BEFORE UPDATE ON access_logs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_session_duration();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE access_logs IS 'Registra todas as tentativas de login e sessões ativas';
COMMENT ON TABLE audit_trail IS 'Auditoria completa de ações administrativas';
COMMENT ON TABLE notifications_sent IS 'Histórico de notificações enviadas manualmente';

COMMENT ON COLUMN access_logs.last_seen IS 'Atualizado pelo heartbeat a cada 60 segundos';
COMMENT ON COLUMN access_logs.is_active IS 'TRUE apenas para sessões ativas no momento';
COMMENT ON COLUMN access_logs.session_duration_seconds IS 'Duração total da sessão em segundos';

COMMENT ON VIEW vw_active_sessions IS 'Sessões ativas com status de presença (online/idle/offline)';
COMMENT ON VIEW vw_login_stats_daily IS 'Estatísticas agregadas de login por dia';

-- =====================================================
-- FIM DA MIGRAÇÃO 004
-- =====================================================
