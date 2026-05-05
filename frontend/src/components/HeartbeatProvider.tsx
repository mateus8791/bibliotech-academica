/**
 * ==============================================================
 * COMPONENTE: HeartbeatProvider
 * ==============================================================
 * Provider que automaticamente envia heartbeats ao backend
 * para manter a sessão ativa e rastrear duração.
 *
 * Deve ser colocado dentro do AuthProvider no layout principal.
 *
 * Autor: Claude Code
 * Data: 2025-11-10
 * ==============================================================
 */

'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHeartbeat } from '@/hooks/useHeartbeat';

interface HeartbeatProviderProps {
  children: ReactNode;
}

export default function HeartbeatProvider({ children }: HeartbeatProviderProps) {
  const { isAuthenticated, logout } = useAuth();

  // Inicia heartbeat apenas se o usuário estiver autenticado
  useHeartbeat({
    enabled: isAuthenticated,
    interval: 60000, // 60 segundos
    onError: (error) => {
      // Se a sessão expirou (401), faz logout automático
      if (error.response?.status === 401) {
        console.warn('[Heartbeat] Sessão expirada, fazendo logout...');
        logout();
      }
    }
  });

  return <>{children}</>;
}
