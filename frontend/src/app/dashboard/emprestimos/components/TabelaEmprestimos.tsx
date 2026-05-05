// Arquivo: frontend/src/app/dashboard/emprestimos/components/TabelaEmprestimos.tsx
'use client';

import React from 'react';

interface EmprestimoRecente {
  id: string;
  livro_titulo: string;
  usuario_nome: string;
  data_emprestimo: string;
  status: string;
}

export const TabelaEmprestimos = ({ data }: { data: EmprestimoRecente[] }) => (
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