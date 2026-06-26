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
  Library,
  Tags,
  PenTool
} from 'lucide-react';

export interface SidebarSubItem {
  label: string;
  href: string;
  permission?: string;
}

export interface SidebarLink {
  label: string;
  href?: string;
  icon: any;
  permission?: string; // Permissão RBAC necessária (opcional)
  subItems?: SidebarSubItem[]; // Suporte para submenu
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
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Gerenciar Biblioteca',
    icon: Library,
    subItems: [
      { label: 'Livros', href: '/dashboard/livros', permission: 'can_view_books' },
      { label: 'Categorias', href: '/dashboard/categorias' },
      { label: 'Autores', href: '/dashboard/autores' }
    ]
  },
  {
    label: 'Empréstimos',
    href: '/dashboard/emprestimos',
    icon: BookMarked,
    permission: 'can_view_loans',
  },
  {
    label: 'Reservas',
    href: '/dashboard/reservas',
    icon: Calendar,
    permission: 'can_view_reservations',
  },
  {
    label: 'Usuários',
    href: '/dashboard/usuarios',
    icon: Users,
    permission: 'can_view_users',
  },
  {
    label: 'Relatórios',
    href: '/dashboard/relatorios',
    icon: BarChart3,
    permission: 'can_view_reports',
  },
  {
    label: 'Perfil',
    href: '/perfil',
    icon: User,
  },
];

export const sidebarConfigAdmin: SidebarLink[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Gerenciar Biblioteca',
    icon: Library,
    subItems: [
      { label: 'Livros', href: '/dashboard/livros', permission: 'can_view_books' },
      { label: 'Categorias', href: '/dashboard/categorias' },
      { label: 'Autores', href: '/dashboard/autores' }
    ]
  },
  {
    label: 'Usuários',
    href: '/dashboard/usuarios',
    icon: Users,
    permission: 'can_view_users',
  },
  {
    label: 'Empréstimos',
    href: '/dashboard/emprestimos',
    icon: BookMarked,
    permission: 'can_view_loans',
  },
  {
    label: 'Relatórios',
    href: '/dashboard/relatorios',
    icon: BarChart3,
    permission: 'can_view_reports',
  },
  {
    label: 'Permissões',
    href: '/dashboard/permissoes',
    icon: Shield,
    permission: 'can_manage_roles',
  },
  {
    label: 'Logs de Acesso',
    href: '/dashboard/logs-acesso',
    icon: FileText,
    permission: 'can_view_logs',
  },
  {
    label: 'Domínios',
    href: '/dashboard/dominios',
    icon: Globe,
    permission: 'can_manage_domains',
  },
  {
    label: 'Integrações',
    href: '/dashboard/integracoes',
    icon: Settings,
  },
  {
    label: 'Configurações',
    href: '/dashboard/configuracoes',
    icon: Settings,
  },
];

// Função para filtrar links baseado em permissões do usuário
export const filterLinksByPermissions = (
  links: SidebarLink[],
  userPermissions: string[]
): SidebarLink[] => {
  return links.map(link => {
    // Se tiver submenu, filtra os submenus
    if (link.subItems) {
      const filteredSubItems = link.subItems.filter(sub => 
        !sub.permission || userPermissions.includes(sub.permission)
      );
      // Se não sobrou nenhum submenu, retorna nulo para filtrar o grupo todo fora depois
      if (filteredSubItems.length === 0) return null;
      return { ...link, subItems: filteredSubItems };
    }
    
    // Sem submenu: verifica permissão direta
    if (!link.permission || userPermissions.includes(link.permission)) {
      return link;
    }
    return null;
  }).filter(Boolean) as SidebarLink[];
};
