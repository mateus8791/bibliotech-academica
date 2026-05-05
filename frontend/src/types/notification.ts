/**
 * =====================================================
 * TYPES: Notificações
 * =====================================================
 * Alinhado com o schema real do banco (tabela notificacoes)
 * =====================================================
 */

export type NotificacaoTipo =
  | 'EMPRESTIMO_REALIZADO'
  | 'DEVOLUCAO_CONFIRMADA'
  | 'PRAZO_VENCENDO'
  | 'PRAZO_VENCIDO'
  | 'RESERVA_DISPONIVEL'
  | 'CONQUISTA'
  | 'ERRO'
  | 'BOAS_VINDAS';

export interface Notification {
  id: string;           // UUID
  usuario_id: string;
  tipo: string;         // NotificacaoTipo
  titulo: string;
  mensagem: string;
  lida: boolean;
  criada_em: string;    // ISO timestamp
  dados?: Record<string, unknown>;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}
