// Arquivo: frontend/src/app/dashboard/emprestimos/page.tsx (Completo e Funcional)
'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { DollarSign, BookUp, TrendingUp, HandCoins } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import TransacaoFinanceiraModal from '@/components/TransacaoFinanceiraModal';

// --- Interfaces ---
interface StatsFinanceiras {
  total_multas: string;
  total_vendas: string;
  orcamento_acervo: string;
}
interface EmprestimoRecente {
  id: string;
  livro_titulo: string;
  usuario_nome: string;
  data_emprestimo: string;
  status: string;
}
interface LivroPopular {
  titulo: string;
  total_emprestimos: string;
}
interface DashboardData {
  emprestimosRecentes: EmprestimoRecente[];
  statsFinanceiras: StatsFinanceiras;
  livrosMaisPopulares: LivroPopular[];
}

// --- Componentes Locais ---
const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ElementType; color: string; }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center">
      <div className={`p-3 rounded-full mr-4 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">
          {parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </div>
    </div>
  </div>
);

const TabelaEmprestimos = ({ data }: { data: EmprestimoRecente[] }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm mt-8">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Últimos Empréstimos</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Livro</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((emprestimo) => (
            <tr key={emprestimo.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{emprestimo.livro_titulo}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emprestimo.usuario_nome}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emprestimo.status === 'ativo' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                  {emprestimo.status}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(emprestimo.data_emprestimo).toLocaleDateString('pt-BR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Página Principal ---
export default function GerenciamentoEmprestimosPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'multa_atraso' | 'venda_livro' | 'orcamento_acervo' | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/emprestimos');
      setDashboardData(response.data);
    } catch (err) {
      void err;
      setError("Não foi possível carregar os dados. Verifique suas permissões.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOpenModal = (tipo: NonNullable<typeof modalType>) => {
    setModalType(tipo);
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center">Carregando dashboard...</div>;
  if (error || !dashboardData) return <div className="p-8 text-center text-red-500">{error || 'Dados não encontrados'}</div>;
  
  const chartData = dashboardData.livrosMaisPopulares.map(livro => ({
      name: livro.titulo,
      Empréstimos: parseInt(livro.total_emprestimos, 10),
  })).reverse();

  const balanco = parseFloat(dashboardData.statsFinanceiras.total_multas) + parseFloat(dashboardData.statsFinanceiras.total_vendas) - parseFloat(dashboardData.statsFinanceiras.orcamento_acervo);

  return (
    <>
        <main className="p-4 sm:p-6 md:p-8 bg-gray-50">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Gerenciamento de Empréstimos e Finanças</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total em Multas" value={dashboardData.statsFinanceiras.total_multas} icon={HandCoins} color="bg-red-500" />
            <StatCard title="Total em Vendas" value={dashboardData.statsFinanceiras.total_vendas} icon={DollarSign} color="bg-green-500" />
            <StatCard title="Orçamento para Acervo" value={dashboardData.statsFinanceiras.orcamento_acervo} icon={BookUp} color="bg-blue-500" />
            <StatCard title="Balanço (Entradas - Saídas)" value={balanco.toString()} icon={TrendingUp} color="bg-purple-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Livros Mais Populares</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} />
                  <Legend />
                  <Bar dataKey="Empréstimos" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
               <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações Financeiras</h3>
               <div className="space-y-3">
                  <button onClick={() => handleOpenModal('multa_atraso')} className="w-full text-left p-3 bg-red-50 hover:bg-red-100 rounded-lg text-red-800 font-medium transition-colors">Registrar Multa Recebida</button>
                  <button onClick={() => handleOpenModal('orcamento_acervo')} className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-800 font-medium transition-colors">Adicionar Orçamento</button>
                  <button onClick={() => handleOpenModal('venda_livro')} className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-800 font-medium transition-colors">Registrar Venda</button>
               </div>
            </div>
          </div>
          <TabelaEmprestimos data={dashboardData.emprestimosRecentes} />
        </main>

      <TransacaoFinanceiraModal 
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        onSuccess={() => {
            setLoading(true);
            fetchDashboardData();
        }}
        tipoTransacao={modalType}
      />
    </>
  );
}