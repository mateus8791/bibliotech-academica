/**
 * =====================================================
 * HOOK: useHeartbeat
 * =====================================================
 * Mantém a sessão do usuário ativa enviando heartbeats
 * ao backend a cada 60 segundos.
 *
 * Usado para rastreamento de duração de sessão
 * e detecção de sessões inativas.
 *
 * Autor: Claude Code
 * Data: 2025-11-10
 * =====================================================
 */

import { useEffect, useRef } from 'react';
import api from '@/services/api';

interface UseHeartbeatOptions {
  enabled?: boolean; // Se false, não envia heartbeats
  interval?: number; // Intervalo em ms (padrão: 60000 = 60s)
  onError?: (error: any) => void; // Callback para erros
}

export function useHeartbeat(options: UseHeartbeatOptions = {}) {
  const {
    enabled = true,
    interval = 60000, // 60 segundos
    onError
  } = options;

  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(enabled);

  useEffect(() => {
    isActiveRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    // Função para enviar o heartbeat
    const sendHeartbeat = async () => {
      if (!isActiveRef.current) return;

      try {
        const response = await api.post('/session/heartbeat');

        // Se o backend indicar que precisa reautenticar
        if (response.data?.requiresReauth) {
          console.warn('[Heartbeat] Token antigo detectado. Faça logout e login novamente.');
          stopHeartbeat();
          return;
        }

        console.log('[Heartbeat] Sessão atualizada');
      } catch (error: any) {
        // Ignora erros 403 silenciosamente (podem ser tokens em transição)
        if (error.response?.status === 403) {
          console.debug('[Heartbeat] Erro 403 ignorado (token em transição)');
          return;
        }

        console.error('[Heartbeat] Erro ao enviar heartbeat:', error);

        // Se retornar 401 ou 404, a sessão expirou
        if (error.response?.status === 401 || error.response?.status === 404) {
          console.warn('[Heartbeat] Sessão expirada, interrompendo heartbeats');
          stopHeartbeat();
        }

        if (onError) {
          onError(error);
        }
      }
    };

    // Função para iniciar heartbeats
    const startHeartbeat = () => {
      // Aguarda 5 segundos antes do primeiro heartbeat para dar tempo do login completar
      const initialDelay = setTimeout(() => {
        sendHeartbeat();

        // Configura o intervalo após o primeiro heartbeat
        intervalIdRef.current = setInterval(sendHeartbeat, interval);
        console.log(`[Heartbeat] Iniciado (intervalo: ${interval}ms)`);
      }, 5000);

      // Armazena o timeout para limpeza
      intervalIdRef.current = initialDelay as any;
    };

    // Função para parar heartbeats
    const stopHeartbeat = () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
        console.log('[Heartbeat] Interrompido');
      }
    };

    // Inicia apenas se enabled for true e houver token
    const token = localStorage.getItem('bibliotech_token');
    if (enabled && token) {
      startHeartbeat();
    }

    // Cleanup ao desmontar ou quando enabled mudar
    return () => {
      stopHeartbeat();
    };
  }, [enabled, interval, onError]);

  // Retorna função para parar manualmente
  const stop = () => {
    isActiveRef.current = false;
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  return { stop };
}
