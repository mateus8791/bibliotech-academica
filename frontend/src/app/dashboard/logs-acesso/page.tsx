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
  FiFilter,
  FiMonitor,
  FiRefreshCw
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      if (!isRefreshing) setLoadingData(true);

      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const [logsRes, statsRes, sessionsRes] = await Promise.all([
        api.get(`/admin/access-logs?page=${currentPage}&limit=20${statusParam}`),
        api.get('/admin/access-logs/stats'),
        api.get('/admin/access-logs/active-sessions')
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
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading || (loadingData && !isRefreshing)) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent shadow-lg"></div>
            <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Carregando dados de auditoria...</p>
          </div>
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
    { name: 'Sucesso', value: stats?.hoje.sucessos_hoje || 0 },
    { name: 'Falha', value: stats?.hoje.falhas_hoje || 0 }
  ];

  const COLORS = ['#10b981', '#f43f5e']; // Emerald 500, Rose 500

  return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
              <FiActivity className="text-blue-600 dark:text-blue-500" />
              Auditoria e Acessos
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">
              Acompanhe as sessões ativas e histórico de logins do sistema em tempo real.
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl shadow-sm transition-all text-sm font-medium"
          >
            <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}
          </button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Logins Hoje"
            value={stats?.hoje.total_hoje || 0}
            icon={<FiCalendar className="w-6 h-6" />}
            gradient="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="Sucessos"
            value={stats?.hoje.sucessos_hoje || 0}
            icon={<FiCheckCircle className="w-6 h-6" />}
            gradient="from-emerald-500 to-green-500"
          />
          <StatCard
            title="Falhas"
            value={stats?.hoje.falhas_hoje || 0}
            icon={<FiXCircle className="w-6 h-6" />}
            gradient="from-rose-500 to-red-500"
          />
          <StatCard
            title="Sessões Ativas"
            value={stats?.sessoesAtivas || 0}
            icon={<FiMonitor className="w-6 h-6" />}
            gradient="from-indigo-500 to-purple-500"
          />
        </div>

        {/* Layout Principal: 2 Colunas */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Coluna Esquerda: Gráficos (Ocupa 2 colunas no XL) */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                Logins nos Últimos 7 Dias
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataDias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#F3F4F6', opacity: 0.1}} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#1F2937', color: '#fff' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Sucessos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Falhas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabela de Logs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Histórico Detalhado</h3>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                  <FiFilter className="text-gray-500 ml-2" />
                  <select
                    value={filter}
                    onChange={e => setFilter(e.target.value as any)}
                    className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer pl-1 pr-8 py-1"
                  >
                    <option value="all">Todos os Acessos</option>
                    <option value="success">Apenas Sucessos</option>
                    <option value="failed">Apenas Falhas</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data / Hora</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duração</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {logs.length > 0 ? logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                              {log.foto_url ? (
                                <img src={log.foto_url} alt={log.nome} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm bg-blue-100 dark:bg-blue-900/30">
                                  {log.nome.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm text-gray-900 dark:text-white">{log.nome}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{log.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              log.status === 'success'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {log.status === 'success' ? 'Sucesso' : 'Falhou'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(log.login_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {formatDuration(log.duracao_calculada)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {log.ip_address}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          Nenhum registro encontrado para este filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 mt-auto">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Mostrando página <span className="font-medium text-gray-900 dark:text-white">{currentPage}</span> de <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Painel Lateral (Ocupa 1 coluna no XL) */}
          <div className="space-y-6">
            
            {/* Gráfico de Pizza (Status Hoje) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Visão Geral de Hoje</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Taxa de sucesso nas tentativas de login</p>
              
              <div className="h-56 relative flex items-center justify-center">
                {stats?.hoje.total_hoje === 0 ? (
                  <p className="text-gray-400 text-sm italic">Nenhum acesso hoje ainda</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#1F2937', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Texto central da Donut Chart */}
                {stats?.hoje.total_hoje !== 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.hoje.total_hoje}</span>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Total</span>
                  </div>
                )}
              </div>
              
              {stats?.hoje.total_hoje !== 0 && (
                <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sucessos ({stats?.hoje.sucessos_hoje})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Falhas ({stats?.hoje.falhas_hoje})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Sessões Ativas */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-auto max-h-[500px]">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  Usuários Online ({activeSessions.length})
                </h3>
              </div>
              
              <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar flex-1">
                {activeSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <FiUsers className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Ninguém online no momento.</p>
                  </div>
                ) : (
                  activeSessions.map(session => (
                    <div key={session.id} className="group flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-blue-100 dark:hover:border-gray-600 transition-all">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                          {session.foto_url ? (
                            <img src={session.foto_url} alt={session.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm bg-blue-100 dark:bg-blue-900/30">
                              {session.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                          session.status_presenca === 'online' ? 'bg-green-500' :
                          session.status_presenca === 'idle' ? 'bg-amber-500' : 'bg-gray-400'
                        }`}></span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{session.nome}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.email}</p>
                      </div>
                      
                      <div className="flex flex-col items-end whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {formatDuration(session.duracao_segundos)}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          IP: {session.ip_address}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
  );
}

// ===== COMPONENTE AUXILIAR =====

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
}

function StatCard({ title, value, icon, gradient }: StatCardProps) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 group hover:shadow-md transition-all">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${gradient} shadow-inner`}>
            {icon}
          </div>
        </div>
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold tracking-wide uppercase">{title}</h3>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1 group-hover:scale-105 transform origin-left transition-transform duration-300">
          {value.toLocaleString('pt-BR')}
        </p>
      </div>
      
      {/* Decorative background element */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 group-hover:scale-150 transition-transform duration-500`}></div>
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
