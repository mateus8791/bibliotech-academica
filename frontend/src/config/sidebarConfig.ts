// Configurações de Sidebar para cada role
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Award,
  User,
  Users,
  BookMarked,
  BarChart3,
  Settings,
  Shield,
  FileText,
  Globe,
  MessageCircle,
} from 'lucide-react';

export interface SidebarLink {
  label: string;
  href: string;
  icon: any;
  permission?: string; // Permissão RBAC necessária (opcional)
}

export const sidebarConfigAluno: SidebarLink[] = [
  {
    label: 'Dashboard',
    href: '/aluno/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Catálogo',
    href: '/catalogo',
    icon: BookOpen,
  },
  {
    label: 'Minhas Reservas',
    href: '/aluno/minhas-reservas',
    icon: Calendar,
  },
  {
    label: 'Comunidade',
    href: '/aluno/comunidade',
    icon: MessageCircle,
  },
  {
    label: 'Conquistas',
    href: '/aluno/conquistas',
    icon: Award,
  },
  {
    label: 'Perfil',
    href: '/aluno/perfil',
    icon: User,
  },
];

export const sidebarConfigBibliotecario: SidebarLink[] = [
  {
    label: 'Dashboard',
    href: '/bibliotecario/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Empréstimos',
    href: '/bibliotecario/emprestimos',
    icon: BookMarked,
    permission: 'can_view_loans',
  },
  {
    label: 'Reservas',
    href: '/bibliotecario/reservas',
    icon: Calendar,
    permission: 'can_view_reservations',
  },
  {
    label: 'Livros',
    href: '/bibliotecario/livros',
    icon: BookOpen,
    permission: 'can_view_books',
  },
  {
    label: 'Usuários',
    href: '/bibliotecario/usuarios',
    icon: Users,
    permission: 'can_view_users',
  },
  {
    label: 'Relatórios',
    href: '/bibliotecario/relatorios',
    icon: BarChart3,
    permission: 'can_view_reports',
  },
  {
    label: 'Perfil',
    href: '/bibliotecario/perfil',
    icon: User,
  },
];

export const sidebarConfigAdmin: SidebarLink[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Usuários',
    href: '/admin/usuarios',
    icon: Users,
    permission: 'can_view_users',
  },
  {
    label: 'Livros',
    href: '/admin/livros',
    icon: BookOpen,
    permission: 'can_view_books',
  },
  {
    label: 'Empréstimos',
    href: '/admin/emprestimos',
    icon: BookMarked,
    permission: 'can_view_loans',
  },
  {
    label: 'Relatórios',
    href: '/admin/relatorios',
    icon: BarChart3,
    permission: 'can_view_reports',
  },
  {
    label: 'Permissões',
    href: '/admin/permissoes',
    icon: Shield,
    permission: 'can_manage_roles',
  },
  {
    label: 'Logs de Acesso',
    href: '/admin/logs-acesso',
    icon: FileText,
    permission: 'can_view_logs',
  },
  {
    label: 'Domínios',
    href: '/admin/dominios',
    icon: Globe,
    permission: 'can_manage_domains',
  },
  {
    label: 'Configurações',
    href: '/admin/configuracoes',
    icon: Settings,
  },
];

// Função para filtrar links baseado em permissões do usuário
export const filterLinksByPermissions = (
  links: SidebarLink[],
  userPermissions: string[]
): SidebarLink[] => {
  return links.filter((link) => {
    // Se o link não tem permissão específica, sempre mostra
    if (!link.permission) return true;
    // Senão, verifica se o usuário tem a permissão
    return userPermissions.includes(link.permission);
  });
};
