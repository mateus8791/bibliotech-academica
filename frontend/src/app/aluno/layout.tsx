'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Se não está autenticado, redireciona para login
      if (!usuario) {
        router.push('/auth/login');
        return;
      }

      // Se não é aluno, redireciona para a área correta
      if (usuario.tipo_usuario !== 'aluno') {
        if (usuario.tipo_usuario === 'admin') {
          router.push('/dashboard/dashboard');
        } else if (usuario.tipo_usuario === 'bibliotecario') {
          router.push('/dashboard/dashboard');
        }
      }
    }
  }, [usuario, loading, router]);

  // Aguarda verificação de autenticação
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

  // Se não for aluno, não renderiza nada (redirecionamento já foi acionado)
  if (!usuario || usuario.tipo_usuario !== 'aluno') {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
