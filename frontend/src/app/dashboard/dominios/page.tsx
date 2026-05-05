'use client';

import RoleGuard from '@/components/layouts/RoleGuard';
import { useState, useEffect } from 'react';
import { notify } from '@/lib/toast';
import { Plus, Edit2, Trash2, Globe, CheckCircle, XCircle, Shield } from 'lucide-react';
import api from '@/services/api';

interface Dominio {
  id: number;
  dominio: string;
  descricao: string;
  ativo: boolean;
  criado_por_nome?: string;
  criado_em: string;
  atualizado_em: string;
}

function DominiosContent() {
  const [dominios, setDominios] = useState<Dominio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDominio, setEditingDominio] = useState<Dominio | null>(null);
  const [formData, setFormData] = useState({
    dominio: '',
    descricao: '',
    ativo: true
  });

  // Carregar domínios ao montar o componente
  useEffect(() => {
    carregarDominios();
  }, []);

  const carregarDominios = async () => {
    try {
      const response = await api.get('/dominios');
      setDominios(response.data);
    } catch (error: any) {
      notify.error(error.response?.data?.mensagem || 'Erro ao carregar domínios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDominio) {
        // Atualizar domínio existente
        await api.put(`/dominios/${editingDominio.id}`, formData);
        notify.success('Domínio atualizado com sucesso!');
      } else {
        // Criar novo domínio
        await api.post('/dominios', formData);
        notify.success('Domínio criado com sucesso!');
      }

      setShowModal(false);
      setFormData({ dominio: '', descricao: '', ativo: true });
      setEditingDominio(null);
      carregarDominios();
    } catch (error: any) {
      notify.error(error.response?.data?.mensagem || 'Erro ao salvar domínio');
    }
  };

  const handleEdit = (dominio: Dominio) => {
    setEditingDominio(dominio);
    setFormData({
      dominio: dominio.dominio,
      descricao: dominio.descricao || '',
      ativo: dominio.ativo
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este domínio? Usuários deste domínio não poderão mais fazer login via Google.')) {
      return;
    }

    try {
      await api.delete(`/dominios/${id}`);
      notify.success('Domínio deletado com sucesso!');
      carregarDominios();
    } catch (error: any) {
      notify.error(error.response?.data?.mensagem || 'Erro ao deletar domínio');
    }
  };

  const handleToggleAtivo = async (id: number) => {
    try {
      await api.patch(`/dominios/${id}/toggle`);
      notify.success('Status do domínio alterado!');
      carregarDominios();
    } catch (error: any) {
      notify.error(error.response?.data?.mensagem || 'Erro ao alterar status');
    }
  };

  const abrirModalNovo = () => {
    setEditingDominio(null);
    setFormData({ dominio: '', descricao: '', ativo: true });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando domínios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Domínios</h1>
          </div>
          <p className="text-gray-600">
            Configure os domínios institucionais permitidos para login via Google OAuth
          </p>
        </div>

        {/* Card de Informação */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Como funciona?</h3>
              <p className="text-sm text-blue-800">
                Apenas usuários com e-mails dos domínios cadastrados e ativos poderão fazer login via Google.
                Por exemplo: se você cadastrar <code className="bg-blue-100 px-1 rounded">@fatec.sp.gov.br</code>,
                apenas emails como <code className="bg-blue-100 px-1 rounded">aluno@fatec.sp.gov.br</code> poderão acessar.
              </p>
            </div>
          </div>
        </div>

        {/* Botão Adicionar */}
        <div className="mb-6">
          <button
            onClick={abrirModalNovo}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Adicionar Novo Domínio
          </button>
        </div>

        {/* Tabela de Domínios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Domínio</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Descrição</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Criado por</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Criado em</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {dominios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <Globe className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Nenhum domínio cadastrado</p>
                    <p className="text-sm">Adicione seu primeiro domínio institucional</p>
                  </td>
                </tr>
              ) : (
                dominios.map((dominio) => (
                  <tr key={dominio.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {dominio.dominio}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {dominio.descricao || <span className="text-gray-400 italic">Sem descrição</span>}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleAtivo(dominio.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          dominio.ativo
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {dominio.ativo ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Inativo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dominio.criado_por_nome || 'Sistema'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(dominio.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(dominio)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(dominio.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingDominio ? 'Editar Domínio' : 'Adicionar Novo Domínio'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Domínio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domínio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.dominio}
                  onChange={(e) => setFormData({ ...formData, dominio: e.target.value })}
                  placeholder="@fatec.sp.gov.br"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Inclua o @ no início (ex: @universidade.edu.br)
                </p>
              </div>

              {/* Campo Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Nome da instituição ou descrição do domínio"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Campo Ativo */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Domínio ativo (permitir logins)
                  </span>
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingDominio(null);
                    setFormData({ dominio: '', descricao: '', ativo: true });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  {editingDominio ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DominiosPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <DominiosContent />
    </RoleGuard>
  );
}
