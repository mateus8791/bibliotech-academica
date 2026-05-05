'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api'; // Verifique se o caminho está correto

// --- Interface Usuario ---
interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo_usuario: 'aluno' | 'bibliotecario' | 'admin' | 'admin';
  foto_url: string | null;
  accessLogId?: number; // ID do log de acesso para heartbeat
}

// --- Interface NotificationData (para dados da API de notificações) ---
// Esta interface define a estrutura dos dados das notificações
interface NotificationData {
  overdueBooks: number;
  daysInactive: number | null;
  showInactivityWarning: boolean;
}

// --- Interface AuthContextType (adicionado 'notifications') ---
interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  loading: boolean;
  notifications: NotificationData | null; // <-- CORREÇÃO: Propriedade adicionada
  login: (email: string, senha: string) => Promise<any>;
  loginWithId: (id: string, profile: 'aluno' | 'bibliotecario' | 'admin') => Promise<Usuario | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationData | null>(null); // <-- Novo estado
  const router = useRouter();

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const token = localStorage.getItem('bibliotech_token');
        const userJson = localStorage.getItem('bibliotech_usuario');

        if (token && userJson) {
          try {
            const loadedUser: Usuario = JSON.parse(userJson);

            // Decodifica o token JWT para verificar se tem accessLogId
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              try {
                // Decodifica base64url (JWT usa base64url, não base64 padrão)
                // Substitui caracteres base64url por base64 padrão
                const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
                // Adiciona padding se necessário
                const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
                const payload = JSON.parse(atob(paddedBase64));

                // Validação: token precisa ter id
                if (!payload.id) {
                  localStorage.removeItem('bibliotech_token');
                  localStorage.removeItem('bibliotech_usuario');
                  return;
                }
              } catch {
                // Token corrompido, força logout
                localStorage.removeItem('bibliotech_token');
                localStorage.removeItem('bibliotech_usuario');
                return;
              }
            }

            setUsuario(loadedUser);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          } catch {
            localStorage.removeItem('bibliotech_token');
            localStorage.removeItem('bibliotech_usuario');
            setUsuario(null);
          }
        }
      } catch {
        // falha silenciosa — estado inicial já é null
      } finally {
        // SEMPRE seta loading como false, mesmo se houver erro
        setLoading(false);
      }
    };
    loadUserFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // O logout não precisa estar na dependência aqui

  const login = async (email: string, senha: string) => {
    // CORREÇÃO: Limpa completamente o estado anterior ANTES de fazer a nova requisição
    const usuarioAnterior = usuario;

    // Limpa o estado do usuário e notificações primeiro
    setUsuario(null);
    setNotifications(null);

    // Remove dados antigos do storage
    localStorage.removeItem('bibliotech_token');
    localStorage.removeItem('bibliotech_usuario');
    delete api.defaults.headers.common['Authorization'];

    // Limpa sessionStorage de notificações do usuário anterior
    if (usuarioAnterior?.id) {
      sessionStorage.removeItem(`notification_dismissed_${usuarioAnterior.id}`);
    }

    // Agora faz a requisição com um estado limpo
    const { data } = await api.post('/auth/login', { email, senha });
    const { usuario: userData, token, perfis } = data;

    // Define os novos dados
    localStorage.setItem('bibliotech_token', token);
    localStorage.setItem('bibliotech_usuario', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUsuario(userData);
    return { perfis };
  };

  const loginWithId = async (id: string, profile: 'aluno' | 'bibliotecario' | 'admin') => {
    // CORREÇÃO: Limpa completamente o estado anterior ANTES de fazer a nova requisição
    const usuarioAnterior = usuario;

    // Limpa o estado do usuário e notificações primeiro
    setUsuario(null);
    setNotifications(null);

    // Remove dados antigos do storage
    localStorage.removeItem('bibliotech_token');
    localStorage.removeItem('bibliotech_usuario');
    delete api.defaults.headers.common['Authorization'];

    // Limpa sessionStorage de notificações do usuário anterior
    if (usuarioAnterior?.id) {
      sessionStorage.removeItem(`notification_dismissed_${usuarioAnterior.id}`);
    }

    // Agora faz a requisição com um estado limpo
    const { data } = await api.post('/auth/login-id', { id, profile });
    const { usuario: userData, token } = data;

    // Define os novos dados
    localStorage.setItem('bibliotech_token', token);
    localStorage.setItem('bibliotech_usuario', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUsuario(userData);
    return userData;
  };

  const logout = async () => {
    const userId = usuario?.id;

    try {
      await api.post('/session/logout');
    } catch {
      // falha silenciosa — logout local prossegue de qualquer forma
    }

    setUsuario(null);
    setNotifications(null); // Limpa notificações no logout
    localStorage.removeItem('bibliotech_token');
    localStorage.removeItem('bibliotech_usuario');
    if (userId) {
      sessionStorage.removeItem(`notification_dismissed_${userId}`); // Limpa o dismiss da sessão
    }
    delete api.defaults.headers.common['Authorization'];
    router.push('/');
  };

  const isAuthenticated = !!usuario;

  return (
    // Adiciona 'notifications' ao valor do contexto
    <AuthContext.Provider value={{ usuario, isAuthenticated, loading, login, loginWithId, logout, notifications }}>
      {!loading ? children : null} {/* Renderiza children apenas quando o loading inicial terminar */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

