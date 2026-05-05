'use client';

/**
 * NotificationBell — sino com badge de não lidas.
 * Ao clicar abre/fecha o NotificationPanel.
 * Usado na SidebarAdmin e SidebarBibliotecario.
 */

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationPanel } from '@/components/NotificationPanel';

interface NotificationBellProps {
  /** Tamanho do ícone (padrão: 20) */
  iconSize?: number;
  /** Classes extras para o botão */
  className?: string;
}

export function NotificationBell({ iconSize = 20, className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`relative p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
        title="Notificações"
      >
        <Bell
          className={`text-gray-600 dark:text-gray-400 ${unreadCount > 0 ? 'animate-[wiggle_1s_ease-in-out]' : ''}`}
          size={iconSize}
        />

        {/* Badge de contagem */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm ring-2 ring-white dark:ring-gray-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel deslizante de notificações */}
      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default NotificationBell;
