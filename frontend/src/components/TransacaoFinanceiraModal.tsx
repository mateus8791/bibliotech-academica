// Arquivo: frontend/src/components/TransacaoFinanceiraModal.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tipoTransacao: 'multa_atraso' | 'venda_livro' | 'orcamento_acervo' | null;
}

export default function TransacaoFinanceiraModal({ isOpen, onClose, onSuccess, tipoTransacao }: ModalProps) {
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValor('');
      setDescricao('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !tipoTransacao) return null;

  const getTitle = () => {
    switch (tipoTransacao) {
      case 'multa_atraso': return 'Registrar Multa Recebida';
      case 'venda_livro': return 'Registrar Venda de Livro';
      case 'orcamento_acervo': return 'Adicionar Orçamento para Acervo';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        descricao,
        valor: parseFloat(valor),
        tipo: tipoTransacao,
      };
      await api.post('/transacoes-financeiras', payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao registrar transação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onMouseDown={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onMouseDown={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">{getTitle()}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="valor" className="block text-sm font-medium text-gray-700">Valor (R$)</label>
            <input
              type="number"
              id="valor"
              name="valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              step="0.01"
              placeholder="Ex: 5.50"
            />
          </div>
          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              id="descricao"
              name="descricao"
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Multa por atraso do livro 'Dom Casmurro'"
            />
          </div>
          {error && <p className="text-sm text-center text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md disabled:bg-blue-300">
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}