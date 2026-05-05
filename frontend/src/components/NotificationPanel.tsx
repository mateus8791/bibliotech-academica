'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check, Trash2, CheckCheck, Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/types/notification';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mapa de tipo → imagem de coruja + estilo
const getTipoConfig = (tipo: string) => {
  switch (tipo) {
    case 'EMPRESTIMO_REALIZADO':
    case 'DEVOLUCAO_CONFIRMADA':
      return {
        owl: '/mascot/owl-success.png',
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
      };
    case 'PRAZO_VENCENDO':
      return {
        owl: '/mascot/owl-warning.png',
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
      };
    case 'PRAZO_VENCIDO':
      return {
        owl: '/mascot/owl-overdue.png',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
      };
    case 'RESERVA_DISPONIVEL':
      return {
        owl: '/mascot/owl-reservation.png',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
      };
    case 'CONQUISTA':
      return {
        owl: '/mascot/owl-achievement.png',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
      };
    case 'BOAS_VINDAS':
    case 'ONBOARDING':
      return {
        owl: '/mascot/owl-welcome.png',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
      };
    case 'ERRO':
    default:
      return {
        owl: '/mascot/owl-error.png',
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700',
      };
  }
};

// Formata timestamp relativo (ex: "2 horas atrás")
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// Item individual de notificação
const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}> = ({ notification, onMarkAsRead, onDelete, onClose }) => {
  const config = getTipoConfig(notification.tipo);
  const router = useRouter();

  const handleOnboardingClick = () => {
    onMarkAsRead(notification.id);
    onClose();
    router.push('/aluno/preferencias');
  };

  return (
    <div
      className={`p-4 rounded-lg border ${config.border} ${config.bg} transition-all duration-200 hover:shadow-md ${
        notification.lida ? 'opacity-60' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Imagem da coruja */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden shadow-sm">
          <img
            src={config.owl}
            alt={notification.tipo}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {notification.titulo}
            </h4>
            {!notification.lida && (
              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
            {notification.mensagem}
          </p>

          {/* Botão especial para notificações de onboarding */}
          {notification.tipo === 'ONBOARDING' && (
            <button
              onClick={handleOnboardingClick}
              className="mb-2 text-sm text-green-700 dark:text-green-400 underline font-medium hover:text-green-800 dark:hover:text-green-300 transition-colors"
            >
              Quero escolher minhas preferências →
            </button>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatRelativeTime(notification.criada_em)}
            </span>

            <div className="flex gap-1">
              {!notification.lida && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Marcar como lida"
                >
                  <Check className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                title="Remover"
              >
                <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Painel principal deslizante
export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Fecha com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Painel deslizante */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Cabeçalho */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Notificações</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {unreadCount > 0 && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-blue-100">
                {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
              </span>
              <button
                onClick={markAllAsRead}
                className="text-xs text-white flex items-center gap-1 px-2 py-1 hover:bg-white/10 rounded transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                Marcar todas como lidas
              </button>
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-16">
              <img
                src="/mascot/owl-success.png"
                alt="Sem notificações"
                width={80}
                height={80}
                className="mb-4 opacity-60"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Tudo em dia!
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma notificação no momento.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onClose={onClose}
              />
            ))
          )}
        </div>

        {/* Rodapé */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
            <button
              onClick={clearAll}
              className="w-full py-2 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
            >
              Limpar todas
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPanel;
