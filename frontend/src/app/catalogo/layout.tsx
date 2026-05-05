'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();

  if (usuario && usuario.tipo_usuario === 'aluno') {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return <>{children}</>;
}
