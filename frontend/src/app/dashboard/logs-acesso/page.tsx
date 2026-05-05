/**
 * =====================================================
 * PÁGINA: Logs de Acesso e Auditoria
 * =====================================================
 * Visualização completa de logs de sessões, estatísticas
 * e sessões ativas em tempo real.
 *
 * Acesso: Admin com permissão can_view_logs
 * =====================================================
 */

'use client';

import RoleGuard from '@/components/layouts/RoleGuard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { notify } from '@/lib/toast';
import {
  FiActivity,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiFilter
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AccessLog {
  id: number;
  nome: string;
  email: string;
  foto_url: string | null;
  login_time: string;
  logout_time: string | null;
  last_seen: string;
  duracao_calculada: number;
  status: string;
  ip_address: string;
  is_active: boolean;
}

interface Stats {
  hoje: {
    total_hoje: number;
    sucessos_hoje: number;
    falhas_hoje: number;
  };
  sessoesAtivas: number;
  ultimos7Dias: Array<{
    data: string;
    total: number;
    sucessos: number;
    falhas: number;
  }>;
  porHora: Array<{
    hora: number;
    total: number;
  }>;
}

interface ActiveSession {
  id: number;
  nome: string;
  email: string;
  foto_url: string | null;
  login_time: string;
  last_seen: string;
  duracao_segundos: number;
  status_presenca: 'online' | 'idle' | 'offline';
}

function LogsAcessoContent() {
  const router = useRouter();
  const { usuario, isAuthenticated, loading } = useAuth();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Verifica autenticação
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }

    if (!loading && usuario && usuario.tipo_usuario === 'aluno') {
      notify.error('Acesso negado!');
      router.push('/catalogo');
    }
  }, [loading, isAuthenticated, usuario, router]);

  // Carrega dados
  useEffect(() => {
    if (isAuthenticated && usuario?.tipo_usuario !== 'aluno') {
      loadData();
    }
  }, [isAuthenticated, usuario, filter, currentPage]);

  const loadData = async () => {
    try {
      setLoadingData(true);

      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const [logsRes, statsRes, sessionsRes] = await Promise.all([
        api.get(`/dashboard/access-logs?page=${currentPage}&limit=20${statusParam}`),
        api.get('/dashboard/access-logs/stats'),
        api.get('/dashboard/access-logs/active-sessions')
      ]);

      setLogs(logsRes.data.logs || []);
      setTotalPages(logsRes.data.paginacao?.totalPaginas || 1);
      setStats(statsRes.data.estatisticas || null);
      setActiveSessions(sessionsRes.data.sessoes || []);
    } catch (error: any) {
      console.error('Erro ao carregar logs:', error);
      notify.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading || loadingData) {
    return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  // Dados para gráficos
  const chartDataDias = stats?.ultimos7Dias.map(d => ({
    data: new Date(d.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    Sucessos: d.sucessos,
    Falhas: d.falhas
  })) || [];

  const chartDataHoras = stats?.porHora.map(h => ({
    hora: `${h.hora}h`,
    Sessões: h.total
  })) || [];

  const pieData = [
    { name: 'Sucessos', value: stats?.hoje.sucessos_hoje || 0 },
    { name: 'Falhas', value: stats?.hoje.falhas_hoje || 0 }
  ];

  const COLORS = ['#10b981', '#ef4444'];

  return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FiActivity className="text-blue-600" />
            Logs de Acesso
          </h1>
          <p className="text-gray-600 mt-2">
            Monitoramento de sessões e auditoria de acessos ao sistema
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Logins Hoje"
            value={stats?.hoje.total_hoje || 0}
            icon={<FiCalendar className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Sucessos"
            value={stats?.hoje.sucessos_hoje || 0}
            icon={<FiCheckCircle className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Falhas"
            value={stats?.hoje.falhas_hoje || 0}
            icon={<FiXCircle className="w-6 h-6" />}
            color="red"
          />
          <StatCard
            title="Sessões Ativas"
            value={stats?.sessoesAtivas || 0}
            icon={<FiUsers className="w-6 h-6" />}
            color="purple"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráfico de Logins por Dia */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Logins nos Últimos 7 Dias</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartDataDias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Sucessos" fill="#10b981" />
                <Bar dataKey="Falhas" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Pizza */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Hoje</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sessões Ativas */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiUsers className="text-green-600" />
            Sessões Ativas Agora ({activeSessions.length})
          </h3>
          <div className="space-y-3">
            {activeSessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma sessão ativa no momento</p>
            ) : (
              activeSessions.map(session => (
                <div key={session.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={session.foto_url || '/default-avatar.png'}
                    alt={session.nome}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{session.nome}</p>
                    <p className="text-sm text-gray-600">{session.email}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        session.status_presenca === 'online'
                          ? 'bg-green-100 text-green-700'
                          : session.status_presenca === 'idle'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {session.status_presenca}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDuration(session.duracao_segundos)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tabela de Logs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Histórico de Acessos</h3>
              <div className="flex items-center gap-2">
                <FiFilter className="text-gray-600" />
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="success">Apenas Sucessos</option>
                  <option value="failed">Apenas Falhas</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duração</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={log.foto_url || '/default-avatar.png'}
                          alt={log.nome}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{log.nome}</p>
                          <p className="text-sm text-gray-500">{log.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {log.status === 'success' ? 'Sucesso' : 'Falha'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(log.login_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDuration(log.duracao_calculada)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-4 text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          )}
        </div>
      </div>
  );
}

// ===== COMPONENTE AUXILIAR =====

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
    </div>
  );
}

export default function LogsAcessoPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <LogsAcessoContent />
    </RoleGuard>
  );
}
