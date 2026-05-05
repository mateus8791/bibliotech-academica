'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import {
  FiUsers, FiBook, FiActivity, FiClock,
  FiTrendingUp, FiShield, FiCheckCircle, FiXCircle,
} from 'react-icons/fi';
import { BarChart3, BookMarked } from 'lucide-react';
import Link from 'next/link';

// ===== DASHBOARD DO ADMIN =====

interface AdminStats {
  totalUsuarios: number;
  totalLivros: number;
  sessoesAtivas: number;
  loginsHoje: number;
}

function AdminDashboard() {
  const { usuario } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, booksRes, logsRes] = await Promise.all([
          api.get('/usuarios'),
          api.get('/livros'),
          api.get('/admin/access-logs/stats'),
        ]);
        setStats({
          totalUsuarios: usersRes.data?.usuarios?.length ?? 0,
          totalLivros: booksRes.data?.length ?? 0,
          sessoesAtivas: logsRes.data?.estatisticas?.sessoesAtivas ?? 0,
          loginsHoje: logsRes.data?.estatisticas?.hoje?.total_hoje ?? 0,
        });
      } catch {
        // erros individuais são tratados pelo interceptor global
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-2">
          Bem-vindo de volta, <span className="font-semibold">{usuario?.nome}</span>
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total de Usuários" value={stats?.totalUsuarios ?? 0} icon={<FiUsers className="w-6 h-6" />} color="blue" loading={loading} link="/dashboard/usuarios" />
        <StatCard title="Total de Livros" value={stats?.totalLivros ?? 0} icon={<FiBook className="w-6 h-6" />} color="green" loading={loading} link="/dashboard/livros" />
        <StatCard title="Sessões Ativas" value={stats?.sessoesAtivas ?? 0} icon={<FiActivity className="w-6 h-6" />} color="purple" loading={loading} link="/dashboard/logs-acesso" />
        <StatCard title="Logins Hoje" value={stats?.loginsHoje ?? 0} icon={<FiClock className="w-6 h-6" />} color="orange" loading={loading} link="/dashboard/logs-acesso" />
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-blue-600" /> Acesso Rápido
          </h2>
          <div className="space-y-3">
            <QuickLink href="/dashboard/logs-acesso" icon={<FiActivity />} title="Logs de Acesso" desc="Visualizar sessões e auditoria" color="blue" />
            <QuickLink href="/dashboard/usuarios" icon={<FiUsers />} title="Gerenciar Usuários" desc="Criar, editar e remover usuários" color="green" />
            <QuickLink href="/dashboard/dominios" icon={<FiShield />} title="Domínios Permitidos" desc="Controlar domínios de e-mail autorizados" color="purple" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo do Sistema</h2>
          <div className="space-y-4">
            <InfoRow label="Usuários Cadastrados" value={stats?.totalUsuarios ?? 0} icon={<FiCheckCircle className="text-green-600" />} loading={loading} />
            <InfoRow label="Sessões Ativas" value={stats?.sessoesAtivas ?? 0} icon={<FiActivity className="text-blue-600" />} loading={loading} />
            <InfoRow label="Logins Hoje" value={stats?.loginsHoje ?? 0} icon={<FiXCircle className="text-orange-600" />} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== DASHBOARD DO BIBLIOTECÁRIO =====

function BibliotecarioDashboard() {
  const { usuario } = useAuth();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard do Bibliotecário</h1>
        <p className="text-gray-600 mt-2">
          Bem-vindo, <span className="font-semibold">{usuario?.nome}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashCard href="/dashboard/emprestimos" icon={<BookMarked className="w-8 h-8 text-blue-600" />} title="Empréstimos" desc="Gerenciar empréstimos ativos e histórico" color="blue" />
        <DashCard href="/dashboard/livros" icon={<FiBook className="w-8 h-8 text-green-600" />} title="Livros" desc="Cadastrar, editar e remover livros do acervo" color="green" />
        <DashCard href="/dashboard/usuarios" icon={<FiUsers className="w-8 h-8 text-purple-600" />} title="Usuários" desc="Gerenciar alunos e acessos" color="purple" />
        <DashCard href="/dashboard/relatorios" icon={<BarChart3 className="w-8 h-8 text-orange-600" />} title="Relatórios" desc="Estatísticas de empréstimos e acervo" color="orange" />
      </div>
    </div>
  );
}

// ===== COMPONENTE RAIZ — bifurca por role =====

export default function DashboardPage() {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !usuario) router.push('/auth/login');
  }, [usuario, loading, router]);

  if (loading || !usuario) return null;

  if (usuario.tipo_usuario === 'admin') return <AdminDashboard />;
  return <BibliotecarioDashboard />;
}

// ===== COMPONENTES AUXILIARES =====

interface StatCardProps { title: string; value: number; icon: React.ReactNode; color: 'blue' | 'green' | 'purple' | 'orange'; loading?: boolean; link?: string; }
function StatCard({ title, value, icon, color, loading, link }: StatCardProps) {
  const colors = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600', orange: 'bg-orange-100 text-orange-600' };
  const card = (
    <div className={`bg-white rounded-xl shadow-md p-6 ${link ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}>
      <div className={`p-3 rounded-lg w-fit mb-4 ${colors[color]}`}>{icon}</div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      {loading ? <div className="mt-2 h-8 w-20 bg-gray-200 animate-pulse rounded" /> : <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>}
    </div>
  );
  return link ? <Link href={link}>{card}</Link> : card;
}

interface QuickLinkProps { href: string; icon: React.ReactNode; title: string; desc: string; color: 'blue' | 'green' | 'purple'; }
function QuickLink({ href, icon, title, desc, color }: QuickLinkProps) {
  const colors = { blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', purple: 'bg-purple-50 text-purple-600' };
  return (
    <Link href={href} className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
      <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
      <div><h3 className="font-semibold text-gray-900">{title}</h3><p className="text-sm text-gray-600">{desc}</p></div>
    </Link>
  );
}

interface InfoRowProps { label: string; value: number; icon: React.ReactNode; loading?: boolean; }
function InfoRow({ label, value, icon, loading }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">{icon}<span className="text-gray-700 font-medium">{label}</span></div>
      {loading ? <div className="h-6 w-12 bg-gray-200 animate-pulse rounded" /> : <span className="text-2xl font-bold text-gray-900">{value}</span>}
    </div>
  );
}

interface DashCardProps { href: string; icon: React.ReactNode; title: string; desc: string; color: 'blue' | 'green' | 'purple' | 'orange'; }
function DashCard({ href, icon, title, desc, color }: DashCardProps) {
  const borders = { blue: 'border-blue-200 hover:border-blue-400', green: 'border-green-200 hover:border-green-400', purple: 'border-purple-200 hover:border-purple-400', orange: 'border-orange-200 hover:border-orange-400' };
  return (
    <Link href={href} className={`bg-white rounded-xl shadow-md p-6 border-2 transition-all hover:shadow-lg ${borders[color]}`}>
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{desc}</p>
    </Link>
  );
}
