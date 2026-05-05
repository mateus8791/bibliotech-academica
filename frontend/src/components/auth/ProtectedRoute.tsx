/**
 * =====================================================
 * COMPONENTE: ProtectedRoute
 * =====================================================
 * Wrapper para proteger rotas baseado em tipo de usuário
 * Redireciona se o usuário não tiver o tipo adequado
 * =====================================================
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { notify } from '@/lib/toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'admin' | 'bibliotecario' | 'aluno';
  requireAuth?: boolean;
  fallbackPath?: string;
}

/**
 * Componente para proteger rotas baseado em tipo de usuário
 *
 * @example
 * // Requer tipo de usuário específico
 * <ProtectedRoute requiredUserType="admin">
 *   <AdminPage />
 * </ProtectedRoute>
 */
export const ProtectedRoute = ({
  children,
  requiredUserType,
  requireAuth = true,
  fallbackPath,
}: ProtectedRouteProps) => {
  const router = useRouter();
  const { isAuthenticated, loading, usuario } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Verifica autenticação
    if (requireAuth && !isAuthenticated) {
      notify.error('Você precisa estar autenticado para acessar esta página.');
      router.push('/auth/login');
      return;
    }

    // Verifica tipo de usuário
    if (requiredUserType && usuario?.tipo_usuario !== requiredUserType) {
      notify.error('Você não tem permissão para acessar esta página.');

      // Redireciona para a página apropriada
      if (fallbackPath) {
        router.push(fallbackPath);
      } else if (usuario?.tipo_usuario === 'admin') {
        router.push('/dashboard/relatorios');
      } else if (usuario?.tipo_usuario === 'bibliotecario') {
        router.push('/dashboard/livros');
      } else {
        router.push('/catalogo');
      }
      return;
    }
  }, [loading, isAuthenticated, requiredUserType, requireAuth, usuario, router, fallbackPath]);

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Não renderiza nada enquanto redireciona
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requiredUserType && usuario?.tipo_usuario !== requiredUserType) {
    return null;
  }

  // Renderiza o conteúdo se todas as verificações passarem
  return <>{children}</>;
};
