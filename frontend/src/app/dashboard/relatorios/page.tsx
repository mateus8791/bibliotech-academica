// Arquivo: frontend/src/app/dashboard/relatorios/page.tsx (Com Cartões Clicáveis)
'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Book, Users, BookUp, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
// 1. Importamos o componente Link
import Link from 'next/link';

// Componente StatCard (sem alterações)
const StatCard = ({ title, value, icon: Icon, color }: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
}) => (
    <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col justify-between h-full transition-transform transform hover:scale-105 hover:shadow-xl">
        <div className="flex justify-between items-start">
            <div className="flex flex-col">
                <span className="text-gray-500 font-medium">{title}</span>
                <span className="text-3xl font-bold text-gray-800">{value}</span>
            </div>
            <div className={`p-3 rounded-full ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

// Define a "forma" dos dados que esperamos da API
interface DashboardData {
  stats: {
    totalLivros: number;
    totalUsuarios: number;
    livrosEmprestados: number;
    livrosAtrasados: number;
  };
  chartData: {
    emprestimosPorMes: {
      mes: string;
      Empréstimos: number;
    }[];
  };
}

export default function RelatoriosPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/relatorios/estatisticas');
        setData(response.data);
      } catch (err) {
        console.error('Falha ao buscar dados do dashboard:', err);
        setError('Não foi possível carregar os dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
        <div className="p-8"><p className="text-center">Carregando relatórios...</p></div>
    );
  }

  if (error) {
    return (
        <div className="p-8"><p className="text-center text-red-500">{error}</p></div>
    );
  }

  return (
      <main className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard de Relatórios</h1>

        {/* 2. Envolvemos os cartões com o componente Link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/dashboard/livros">
            <StatCard
              title="Total de Livros"
              value={data?.stats?.totalLivros ?? 0}
              icon={Book}
              color="bg-blue-500"
            />
          </Link>
          <Link href="/dashboard/usuarios">
            <StatCard
              title="Total de Usuários"
              value={data?.stats?.totalUsuarios ?? 0}
              icon={Users}
              color="bg-green-500"
            />
          </Link>
          <Link href="/dashboard/emprestimos">
            <StatCard
              title="Livros Emprestados"
              value={data?.stats?.livrosEmprestados ?? 0}
              icon={BookUp}
              color="bg-yellow-500"
            />
          </Link>
          {/* Este cartão não é clicável, pois é apenas um alerta */}
          <StatCard
            title="Livros Atrasados"
            value={data?.stats?.livrosAtrasados ?? 0}
            icon={AlertTriangle}
            color="bg-red-500"
          />
        </div>

        {/* Área do Gráfico de Linha (sem alterações) */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Empréstimos nos Últimos 6 Meses</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <LineChart
                data={data?.chartData?.emprestimosPorMes}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Empréstimos" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
  );
}