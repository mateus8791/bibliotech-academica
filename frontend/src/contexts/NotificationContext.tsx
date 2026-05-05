'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Notification, NotificationContextType } from '@/types/notification';
import { useAuth } from './AuthContext';
import api from '@/services/api';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const POLLING_INTERVAL = 30000; // 30 segundos
const MAX_NOTIFICATIONS = 50;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { usuario } = useAuth();

  const unreadCount = notifications.filter(n => !n.lida).length;

  // Busca TODAS as notificações (lidas + não lidas) da API real
  const fetchNotifications = useCallback(async () => {
    if (!usuario) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/notificacoes/todas');
      const data: Notification[] = response.data;
      setNotifications(data.slice(0, MAX_NOTIFICATIONS));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao buscar notificações';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  // Marca uma notificação como lida
  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notificacoes/${id}/lida`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, lida: true } : n))
      );
    } catch (err) {
      console.error('[NotificationContext] Erro ao marcar como lida:', err);
    }
  }, []);

  // Marca todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notificacoes/todas/lidas');
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (err) {
      console.error('[NotificationContext] Erro ao marcar todas como lidas:', err);
    }
  }, []);

  // Deleta uma notificação
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.delete(`/notificacoes/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('[NotificationContext] Erro ao deletar notificação:', err);
    }
  }, []);

  // Limpa todas localmente (chama deletar todas uma a uma não é ideal — aqui só limpa o estado)
  const clearAll = useCallback(async () => {
    try {
      // Marca todas como lidas no backend e limpa o estado local
      await api.put('/notificacoes/todas/lidas');
      setNotifications([]);
    } catch (err) {
      console.error('[NotificationContext] Erro ao limpar notificações:', err);
    }
  }, []);

  // Busca inicial + polling de 30 segundos
  useEffect(() => {
    if (!usuario) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [usuario, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
