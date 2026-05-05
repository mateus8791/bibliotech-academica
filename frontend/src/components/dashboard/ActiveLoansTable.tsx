'use client';

import React from 'react';
import Image from 'next/image';
import { Calendar, AlertCircle } from 'lucide-react';

interface Emprestimo {
  id: number;
  livro_titulo: string;
  livro_capa_url: string | null;
  autores: string;
  data_devolucao_prevista?: string;
  data_expiracao?: string;
  status: 'ativo' | 'atrasado' | 'renovado' | 'disponivel' | 'aguardando';
  dias_restantes?: number;
}

interface ActiveLoansTableProps {
  emprestimos: Emprestimo[];
}

export const ActiveLoansTable: React.FC<ActiveLoansTableProps> = ({ emprestimos }) => {
  const getStatusBadge = (status: string, diasRestantes?: number) => {
    // Status de reserva
    if (status === 'disponivel') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <Calendar className="w-3 h-3" />
          Disponível
        </span>
      );
    }
    if (status === 'aguardando') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <Calendar className="w-3 h-3" />
          Aguardando
        </span>
      );
    }
    // Status de empréstimo
    if (status === 'atrasado' || (diasRestantes !== undefined && diasRestantes < 0)) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertCircle className="w-3 h-3" />
          Atrasado
        </span>
      );
    }
    if (diasRestantes !== undefined && diasRestantes <= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <Calendar className="w-3 h-3" />
          Vence em breve
        </span>
      );
    }
    if (status === 'renovado') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          Renovado
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Em dia
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!emprestimos || emprestimos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Você não possui reservas ativas no momento.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">
              Livro
            </th>
            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">
              Autor(es)
            </th>
            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">
              Expira em
            </th>
            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {emprestimos.map((emprestimo) => (
            <tr
              key={emprestimo.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    {emprestimo.livro_capa_url ? (
                      <Image
                        src={emprestimo.livro_capa_url}
                        alt={emprestimo.livro_titulo}
                        width={48}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                        <span className="text-white text-xs font-bold">
                          {emprestimo.livro_titulo.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 line-clamp-2">
                      {emprestimo.livro_titulo}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <p className="text-sm text-gray-600">{emprestimo.autores}</p>
              </td>
              <td className="py-4 px-4">
                <p className="text-sm text-gray-900 font-medium">
                  {formatDate(emprestimo.data_expiracao || emprestimo.data_devolucao_prevista || '')}
                </p>
                {emprestimo.dias_restantes !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    {emprestimo.dias_restantes > 0
                      ? `${emprestimo.dias_restantes} dias restantes`
                      : emprestimo.dias_restantes === 0
                      ? 'Expira hoje'
                      : `Expirado há ${Math.abs(emprestimo.dias_restantes)} dias`}
                  </p>
                )}
              </td>
              <td className="py-4 px-4">
                {getStatusBadge(emprestimo.status, emprestimo.dias_restantes)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
