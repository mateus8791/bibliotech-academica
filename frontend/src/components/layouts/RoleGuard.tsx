'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'bibliotecario' | 'aluno'>;
  /** Rota para redirecionar caso o role não bata. Padrão: /dashboard */
  redirectTo?: string;
}

/**
 * Protege um trecho da UI verificando o role do usuário autenticado.
 * - Se o role bate → renderiza children
 * - Se não bate → redireciona para redirectTo (padrão: /dashboard)
 */
export default function RoleGuard({ children, allowedRoles, redirectTo = '/dashboard' }: RoleGuardProps) {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!usuario) {
      router.push('/auth/login');
      return;
    }
    if (!allowedRoles.includes(usuario.tipo_usuario)) {
      router.push(redirectTo);
    }
  }, [usuario, loading, router, allowedRoles, redirectTo]);

  if (loading || !usuario) return null;
  if (!allowedRoles.includes(usuario.tipo_usuario)) return null;

  return <>{children}</>;
}
