'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRoute, type AccessLevel } from '@/utils/redirectByRole';

/**
 * Componente que redireciona o usuário para a rota padrão baseada em sua role
 * Usado após login bem-sucedido
 */
export default function RoleRedirect() {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && usuario) {
      const defaultRoute = getDefaultRoute(usuario.tipo_usuario as AccessLevel);
      router.push(defaultRoute);
    } else if (!loading && !usuario) {
      // Se não está logado, vai para login
      router.push('/auth/login');
    }
  }, [usuario, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Redirecionando...
        </h2>
        <p className="text-gray-600">
          Você será direcionado para sua área de trabalho
        </p>
      </div>
    </div>
  );
}
