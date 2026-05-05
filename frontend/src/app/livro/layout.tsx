'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Layout para /livro/[id]
 * Envolve a página de detalhe do livro com a sidebar correta,
 * igual ao que /catalogo faz para o usuário aluno.
 */
export default function LivroLayout({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();

  // Usuários autenticados (aluno, bibliotecario, admin) recebem a sidebar
  if (usuario) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  // Visitante sem login — exibe a página sem sidebar
  return <>{children}</>;
}
