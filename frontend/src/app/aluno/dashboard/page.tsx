'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { BookOpen, Clock, DollarSign, Award, Sparkles } from 'lucide-react';
import { useRecomendacoes } from '@/lib/hooks/useRecomendacoes';
import { LivroRecomendado } from '@/types/preferencias';
import { OwlNotification } from '@/components/preferencias/OwlNotification';

// Importar componentes
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { CategoriesChart } from '@/components/dashboard/CategoriesChart';
import { ActiveLoansTable } from '@/components/dashboard/ActiveLoansTable';
import { PopularBooksList } from '@/components/dashboard/PopularBooksList';

interface DashboardData {
  kpis: {
    reservas_disponiveis: number;
    reservas_aguardando: number;
    multas_pendentes: string;
    livros_retirados: number;
  };
  atividade: Array<{
    mes: string;
    livros: number;
  }>;
  categorias: Array<{
    nome: string;
    quantidade: number;
    percentual: number;
  }>;
  reservasAtivas: Array<{
    id: number;
    livro_titulo: string;
    livro_capa_url: string | null;
    autores: string;
    data_expiracao: string;
    status: 'disponivel' | 'aguardando';
    dias_restantes: number;
  }>;
  livrosPopulares: Array<{
    id: number;
    titulo: string;
    capa_url: string | null;
    autores: string;
    total_reservas: number;
  }>;
}

export default function AlunoDashboardPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: recomData } = useRecomendacoes();
  const [showOwlNotification, setShowOwlNotification] = useState(false);

  const [historico, setHistorico] = useState<any[]>([]);

  // Mostrar notificação quando recomData carregou e não tem preferências
  useEffect(() => {
    if (recomData && !recomData.temPreferencias) {
      setShowOwlNotification(true);
    }
  }, [recomData]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Verifica se há token antes de fazer a requisição
        const token = localStorage.getItem('bibliotech_token');
        if (!token) {
          console.warn('[Dashboard] Token não encontrado no localStorage');
          setError('Você precisa estar autenticado para acessar o dashboard. Redirecionando para login...');
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
          return;
        }

        console.log('[Dashboard] Buscando dados do dashboard...');
        const [response, historicoRes] = await Promise.all([
          api.get('/dashboard/aluno'),
          api.get('/loans/historico').catch(() => ({ data: [] }))
        ]);
        
        console.log('[Dashboard] Dados recebidos com sucesso:', response.data);
        setData(response.data);
        setHistorico(historicoRes.data);
        setError(null);
      } catch (error: any) {
        console.error('Erro ao carregar dados do dashboard:', error);

        // Mensagens de erro mais específicas
        let errorMessage = 'Não foi possível carregar os dados do dashboard.';

        if (error.response?.status === 401) {
          errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
        } else if (error.response?.status === 403) {
          errorMessage = 'Você não tem permissão para acessar este dashboard.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Endpoint do dashboard não encontrado.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Erro no servidor. Por favor, tente novamente mais tarde.';
          console.error('[Dashboard] Detalhes do erro 500:', error.response?.data);
        } else if (!error.response) {
          errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // Formatação de moeda
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      {/* Cabeçalho com Saudação */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Olá, {usuario?.nome?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Aqui está um resumo da sua atividade na biblioteca
        </p>
      </div>

      {/* KPIs - Linha de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Prontas para Retirada"
          value={`${data?.kpis.reservas_disponiveis || 0}`}
          icon={BookOpen}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          valueColor="text-green-600"
        />
        <KPICard
          title="Aguardando na Fila"
          value={`${data?.kpis.reservas_aguardando || 0}`}
          icon={Clock}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
          valueColor="text-amber-600"
        />
        <KPICard
          title="Pendências Financeiras"
          value={formatCurrency(data?.kpis.multas_pendentes || 0)}
          icon={DollarSign}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
          valueColor="text-orange-600"
        />
        <KPICard
          title="Livros Retirados"
          value={`${data?.kpis.livros_retirados || 0}+`}
          icon={Award}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          valueColor="text-purple-600"
        />
      </div>

      {/* Seção "Para Você" — só exibe quando tem recomendações */}
      {recomData?.temPreferencias && recomData.livros.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Para Você</h2>
            </div>
            <Link 
              href="/catalogo" 
              className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
            >
              Confira mais no catálogo ›
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {recomData.livros.map((livro: LivroRecomendado) => (
              <Link
                href={`/livro/${livro.id}`}
                key={livro.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className="aspect-[2/3] bg-gray-100 dark:bg-gray-700 relative">
                  {livro.capa_url ? (
                    <img
                      src={livro.capa_url}
                      alt={livro.titulo}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 right-1 text-center text-[10px] font-medium bg-black/70 backdrop-blur-sm text-white rounded px-1 py-0.5 leading-tight">
                    {livro.motivo}
                  </span>
                </div>
                <div className="p-3 flex flex-col flex-1 justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                      {livro.titulo}
                    </p>
                    {livro.autor_nome && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                        {livro.autor_nome}
                      </p>
                    )}
                  </div>
                  <button
                    className={`mt-auto w-full py-1.5 text-xs font-bold rounded-md transition-colors ${
                      livro.disponivel
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200'
                    }`}
                  >
                    Reservar
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Nova Seção "Livros Já Lidos" */}
      {historico && historico.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Livros Já Lidos</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {historico.slice(0, 5).map((livro: any) => (
              <Link
                href={`/livro/${livro.livro_id}`}
                key={livro.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col opacity-90 hover:opacity-100"
              >
                <div className="aspect-[2/3] bg-gray-100 dark:bg-gray-700 relative grayscale-[0.2] group-hover:grayscale-0 transition-all">
                  {livro.capa_url ? (
                    <img
                      src={livro.capa_url}
                      alt={livro.titulo}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 right-1 text-center text-[10px] font-medium bg-black/70 backdrop-blur-sm text-white rounded px-1 py-0.5 leading-tight">
                    Devolvido em {new Date(livro.data_devolucao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="p-3 flex flex-col flex-1 justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                      {livro.titulo}
                    </p>
                    {livro.autor_nome && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                        {livro.autor_nome}
                      </p>
                    )}
                  </div>
                  <button
                    className="mt-auto w-full py-1.5 text-xs font-bold rounded-md transition-colors bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200"
                  >
                    Reservar de novo
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notificação flutuante — aparece se não tem preferências */}
      {showOwlNotification && (
        <OwlNotification onClose={() => setShowOwlNotification(false)} />
      )}

      {/* Linha 2: Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gráfico de Atividade - 2 colunas */}
        <div className="lg:col-span-2">
          <ChartCard title="Minha Atividade" subtitle="Reservas realizadas nos últimos 6 meses">
            <ActivityChart data={data?.atividade || []} />
          </ChartCard>
        </div>

        {/* Gráfico de Categorias - 1 coluna */}
        <div className="lg:col-span-1">
          <ChartCard title="Minhas Categorias" subtitle="Distribuição de livros retirados">
            <CategoriesChart data={data?.categorias || []} />
          </ChartCard>
        </div>
      </div>

      {/* Linha 3: Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabela de Reservas Ativas - 2 colunas */}
        <div className="lg:col-span-2">
          <ChartCard title="Minhas Reservas Ativas" subtitle="Livros disponíveis e aguardando">
            <ActiveLoansTable emprestimos={data?.reservasAtivas || []} />
          </ChartCard>
        </div>

        {/* Lista de Livros Populares - 1 coluna */}
        <div className="lg:col-span-1">
          <ChartCard
            title="Mais Populares"
            subtitle="Os mais reservados da biblioteca"
          >
            <PopularBooksList livros={data?.livrosPopulares || []} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
