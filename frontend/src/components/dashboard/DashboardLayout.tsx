/**
 * =====================================================
 * LAYOUT: Dashboard
 * =====================================================
 * Layout principal com sidebar dinâmica baseada no tipo de usuário
 * Renderiza a sidebar correta para cada tipo de usuário
 * =====================================================
 */

'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarAluno } from './SidebarAluno';
import { Sidebar } from './Sidebar';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { usuario } = useAuth();

  const renderSidebar = () => {
    if (usuario?.tipo_usuario === 'admin' || usuario?.tipo_usuario === 'bibliotecario') {
      return <Sidebar />;
    }
    return <SidebarAluno />;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
      {/* Menu Lateral Dinâmico */}
      {renderSidebar()}

      {/* Conteúdo Principal da Página */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;