/**
 * =====================================================
 * SIDEBAR: Aluno
 * =====================================================
 * Menu lateral customizado para perfil de ALUNO
 * Acesso: Dashboard, Catálogo, Reservas, Comunidade, Conquistas, Perfil
 * Design moderno inspirado em Exvora - UX-first, responsivo
 * =====================================================
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BookOpen,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Sun,
  Moon,
  LayoutDashboard,
  Calendar,
  Star,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationPanel from '@/components/NotificationPanel';
import { useTemPreferencias } from '@/lib/hooks/useRecomendacoes';

const NavLink = ({ href, icon: Icon, label, onClick, isCollapsed, badge, badgeOrange }: {
  href: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  isCollapsed?: boolean;
  badge?: number;
  badgeOrange?: boolean;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  const content = (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group relative ${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
      }`}
    >
      <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5'} flex-shrink-0`} />
      {!isCollapsed && (
        <span className="font-medium flex-1">{label}</span>
      )}

      {/* Badge de notificação (número vermelho) */}
      {badge && badge > 0 && !isCollapsed && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}

      {/* Badge laranja (ponto) — indica ação pendente */}
      {badgeOrange && !isCollapsed && (
        <span className="w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0" />
      )}
      {badgeOrange && isCollapsed && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
      )}

      {/* Tooltip quando colapsado */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : <button onClick={onClick} className="w-full text-left">{content}</button>;
};

export const SidebarAluno = () => {
  const { logout, usuario } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const { data: prefData } = useTemPreferencias();
  const semPreferencias = prefData ? !prefData.temPreferencias : false;

  const navLinks = [
    { href: '/aluno/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/catalogo', icon: BookOpen, label: 'Catálogo' },
    { href: '/aluno/minhas-reservas', icon: Calendar, label: 'Minhas Reservas' },
    { href: '/aluno/preferencias', icon: Star, label: 'Minhas Preferências', badgeOrange: semPreferencias },
    { href: '/aluno/perfil', icon: User, label: 'Meu Perfil' },
  ];

  // Usuários online (exemplo - você pode buscar do backend depois)
  const onlineUsers = [
    { id: 1, nome: 'Erik Gunsel', iniciais: 'EG', color: 'from-pink-500 to-purple-500' },
    { id: 2, nome: 'Emily Smith', iniciais: 'ES', color: 'from-blue-500 to-cyan-500' },
    { id: 3, nome: 'Arthur Adelk', iniciais: 'AA', color: 'from-green-500 to-emerald-500' },
  ];

  // Primeira letra do nome para avatar fallback
  const getInitials = (name: string) => {
    const names = name?.split(' ') || ['U'];
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  };

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white dark:bg-gray-900 flex flex-col transition-all duration-300 relative border-r border-gray-200 dark:border-gray-800 shadow-sm`}
    >
      {/* Logo/Brand */}
      <div className={`${isCollapsed ? 'p-4' : 'p-6'} flex items-center justify-center transition-all duration-300`}>
        {isCollapsed ? (
          <Image
            src="/logo.png"
            alt="BiblioTech"
            width={40}
            height={40}
            sizes="40px"
            className="rounded-lg"
          />
        ) : (
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="BiblioTech"
              width={48}
              height={48}
              sizes="48px"
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-gray-900 dark:text-white">BiblioTech</span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className={`${isCollapsed ? 'px-2 pb-4' : 'px-4 pb-6'} border-b border-gray-200 dark:border-gray-800 transition-all duration-300`}>
        <div className={`flex ${isCollapsed ? 'flex-col items-center gap-2' : 'items-center gap-3'}`}>
          {/* Foto do usuário */}
          <div className="relative group flex-shrink-0">
            {usuario?.foto_url ? (
              <div className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-full overflow-hidden ring-2 ring-blue-200 dark:ring-blue-700 shadow-md`}>
                <Image
                  src={usuario.foto_url}
                  alt={usuario.nome}
                  width={isCollapsed ? 40 : 48}
                  height={isCollapsed ? 40 : 48}
                  sizes={isCollapsed ? "40px" : "48px"}
                  className="w-full h-full object-cover"
                  quality={95}
                />
              </div>
            ) : (
              <div className={`${isCollapsed ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-blue-200 dark:ring-blue-700`}>
                {getInitials(usuario?.nome || 'Usuário')}
              </div>
            )}
            {/* Indicador online */}
            <div className={`absolute ${isCollapsed ? 'bottom-0 right-0' : 'bottom-0 right-0.5'} w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm`}></div>
          </div>

          {/* Informações do usuário */}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                {usuario?.nome || 'Usuário'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                Aluno
              </p>
            </div>
          )}

          {/* Botão de notificações (apenas quando expandido) */}
          {!isCollapsed && (
            <button
              onClick={() => setIsNotificationPanelOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative group"
              title="Notificações"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        <div className={`${isCollapsed ? 'hidden' : 'block'} text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2`}>
          Main
        </div>

        {navLinks.map(({ badgeOrange, ...link }) => (
          <NavLink key={link.href} {...link} isCollapsed={isCollapsed} badgeOrange={badgeOrange} />
        ))}
      </nav>

      {/* Usuários Online */}
      {!isCollapsed && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800 pt-4">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Usuários Online
            </span>
            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xl font-light">
              +
            </button>
          </div>
          <div className="space-y-2">
            {onlineUsers.map((user) => (
              <button
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 w-full"
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                  {user.iniciais}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{user.nome}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botão de Toggle Tema e Logout */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-gray-200 dark:border-gray-800 space-y-2`}>
        {/* Toggle de Tema */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 w-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 flex-shrink-0" />
          ) : (
            <Sun className="w-5 h-5 flex-shrink-0" />
          )}
          {!isCollapsed && (
            <span className="font-medium">
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 w-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Sair</span>}
        </button>
      </div>

      {/* Botão de colapsar/expandir */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 z-50 shadow-md"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Painel de Notificações */}
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
      />
    </aside>
  );
};
