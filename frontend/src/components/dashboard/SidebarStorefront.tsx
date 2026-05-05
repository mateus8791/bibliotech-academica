'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { BookOpen, ShoppingBag, ClipboardList, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Componente de link de navegação
const NavLink = ({ href, icon: Icon, label }: {
  href: string; icon: React.ElementType; label: string;
}) => {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href}>
      <div
        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
          active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
      >
        <Icon className="w-5 h-5 mr-3" />
        <span>{label}</span>
      </div>
    </Link>
  );
};

// Sidebar da loja / visitante
export const SidebarStorefront = () => {
  const { logout } = useAuth();

  const links = [
    { href: '/loja', icon: BookOpen, label: 'Catálogo' },
    { href: '/checkout/sacola', icon: ShoppingBag, label: 'Sacola / Checkout' },
    { href: '/conta/pedidos', icon: ClipboardList, label: 'Acompanhar Pedido' },
    { href: '/ajuda', icon: HelpCircle, label: 'Ajuda' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-800 text-white flex flex-col z-40">
      {/* Cabeçalho */}
      <div className="flex items-center justify-center p-4 border-b border-gray-700 h-20">
        <Image src="/logo.png" alt="Logo Bibliotech" width={40} height={40} />
        <h2 className="text-2xl font-bold ml-3">Bibliotech</h2>
      </div>

      {/* Links de navegação */}
      <nav className="flex-1 p-4 space-y-2">
        {links.map(link => (
          <NavLink key={link.href} {...link} />
        ))}
      </nav>

      {/* Botão de logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full flex items-center p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};
