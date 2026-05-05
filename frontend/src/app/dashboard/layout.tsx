'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

/**
 * Layout unificado para /dashboard.
 * Aceita admin e bibliotecario. Redireciona aluno e não-autenticados.
 */
export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!usuario) {
      router.push('/auth/login');
      return;
    }

    if (usuario.tipo_usuario === 'aluno') {
      router.push('/aluno/dashboard');
    }
  }, [usuario, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!usuario || usuario.tipo_usuario === 'aluno') return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}
