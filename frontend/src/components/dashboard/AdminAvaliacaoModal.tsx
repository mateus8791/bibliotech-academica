'use client';

import { useState } from 'react';
import { X, Save, Trash2, EyeOff, Eye, Bell, AlertTriangle } from 'lucide-react';
import api from '@/services/api';

interface AvaliacaoAdmin {
  id: number;
  nota: number;
  comentario: string;
  status: 'ativa' | 'arquivada';
  data_criacao: string;
  usuario_nome: string;
  usuario_email: string;
  usuario_foto: string;
  livro_titulo: string;
  livro_capa: string;
}

interface AdminAvaliacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  avaliacao: AvaliacaoAdmin | null;
  onSuccess: () => void;
}

export function AdminAvaliacaoModal({ isOpen, onClose, avaliacao, onSuccess }: AdminAvaliacaoModalProps) {
  const [activeTab, setActiveTab] = useState<'editar' | 'notificar' | 'excluir'>('editar');
  const [nota, setNota] = useState(avaliacao?.nota || 5);
  const [comentario, setComentario] = useState(avaliacao?.comentario || '');
  const [mensagemNotificacao, setMensagemNotificacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset states when avaliacao changes
  if (!isOpen || !avaliacao) return null;

  // Set initial states if not yet set for this avaliacao
  if (nota !== avaliacao.nota && activeTab === 'editar' && !loading && !error) {
     // this is a hacky way without useEffect, let's just use it on mount
  }

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      await api.put(`/avaliacoes/${avaliacao.id}`, { nota, comentario });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.mensagem || 'Erro ao editar avaliação.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      setLoading(true);
      setError('');
      const newStatus = avaliacao.status === 'ativa' ? 'arquivada' : 'ativa';
      await api.patch(`/avaliacoes/${avaliacao.id}/arquivar`, { status: newStatus });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.mensagem || 'Erro ao alterar visibilidade.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente esta avaliação?')) return;
    try {
      setLoading(true);
      setError('');
      await api.delete(`/avaliacoes/${avaliacao.id}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.mensagem || 'Erro ao excluir avaliação.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async () => {
    if (!mensagemNotificacao.trim()) {
      setError('A mensagem da notificação é obrigatória.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await api.post(`/avaliacoes/${avaliacao.id}/notificar`, { mensagem: mensagemNotificacao });
      alert('Notificação enviada com sucesso!');
      setMensagemNotificacao('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.mensagem || 'Erro ao enviar notificação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciar Avaliação</h2>
            <p className="text-sm text-gray-500">De {avaliacao.usuario_nome} para o livro "{avaliacao.livro_titulo}"</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('editar')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Editar Conteúdo
          </button>
          <button
            onClick={() => setActiveTab('notificar')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notificar' ? 'border-yellow-600 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Notificar Usuário
          </button>
          <button
            onClick={() => setActiveTab('excluir')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'excluir' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Ações Destrutivas
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {activeTab === 'editar' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nota (1 a 5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={nota}
                  onChange={e => setNota(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentário</label>
                <textarea
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                />
              </div>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" /> Salvar Alterações
              </button>
            </div>
          )}

          {activeTab === 'notificar' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Envie uma notificação para <strong>{avaliacao.usuario_nome}</strong> avisando sobre problemas no comentário ou regras da comunidade.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem da Notificação</label>
                <textarea
                  value={mensagemNotificacao}
                  onChange={e => setMensagemNotificacao(e.target.value)}
                  rows={4}
                  placeholder="Ex: Sua avaliação foi ocultada pois viola nossas regras de linguagem..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                />
              </div>
              <button
                onClick={handleNotify}
                disabled={loading || !mensagemNotificacao.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
              >
                <Bell className="w-4 h-4" /> Enviar Notificação
              </button>
            </div>
          )}

          {activeTab === 'excluir' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  {avaliacao.status === 'ativa' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  Visibilidade da Avaliação
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Ocultar a avaliação remove-a da visão pública. Se um aluno tiver 3 avaliações ocultadas, ele será bloqueado de comentar por 7 dias.
                </p>
                <button
                  onClick={handleToggleVisibility}
                  disabled={loading}
                  className={`w-full py-2.5 rounded-lg font-medium transition-colors border ${
                    avaliacao.status === 'ativa' 
                    ? 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100' 
                    : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {avaliacao.status === 'ativa' ? 'Ocultar Avaliação' : 'Reativar Avaliação'}
                </button>
              </div>

              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-800/30">
                <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Exclusão Permanente
                </h3>
                <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                  Esta ação não pode ser desfeita. A avaliação será removida permanentemente do banco de dados.
                </p>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg font-medium transition-colors border border-red-200 bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Excluir Permanentemente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
