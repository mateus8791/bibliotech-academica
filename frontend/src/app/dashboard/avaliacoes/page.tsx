'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Search,
  MessageSquare,
  BookOpen,
  Settings
} from 'lucide-react';
import { AdminAvaliacaoModal } from '@/components/dashboard/AdminAvaliacaoModal';

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

export default function AvaliacoesAdminPage() {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<AvaliacaoAdmin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAvaliacoes();
  }, []);

  const fetchAvaliacoes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/avaliacoes'); // Assume endpoint /api/avaliacoes retorna lista se for admin
      // A rota atual backend é /api/avaliacoes e ela retorna todas se for admin/bibliotecario e tem os campos necessários?
      // Pelo que vimos, existe a rota listarAvaliacoes. Vou assumir que ela retorna todas as avaliações no backend.
      setAvaliacoes(data);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageClick = (avaliacao: AvaliacaoAdmin) => {
    setSelectedAvaliacao(avaliacao);
    setIsModalOpen(true);
  };

  const filteredAvaliacoes = avaliacoes.filter(av => 
    av.livro_titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    av.usuario_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (av.comentario && av.comentario.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            Gestão de Avaliações
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Administre as avaliações e comentários feitos pelos alunos.
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por livro, aluno ou comentário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aluno</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Livro & Avaliação</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comentário</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAvaliacoes.length > 0 ? (
                  filteredAvaliacoes.map((av) => (
                    <tr key={av.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      {/* Aluno */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0 overflow-hidden">
                            {av.usuario_foto ? (
                              <img src={av.usuario_foto} alt={av.usuario_nome} className="w-full h-full object-cover" />
                            ) : (
                              av.usuario_nome.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{av.usuario_nome}</p>
                            <p className="text-xs text-gray-500">{av.usuario_email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Livro e Nota */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]" title={av.livro_titulo}>
                              {av.livro_titulo}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= av.nota
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Comentário */}
                      <td className="px-6 py-4">
                        {av.comentario ? (
                          <div className="flex items-start gap-2 max-w-[300px]">
                            <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2" title={av.comentario}>
                              "{av.comentario}"
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sem comentário</span>
                        )}
                      </td>

                      {/* Data */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(av.data_criacao).toLocaleDateString('pt-BR')}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleManageClick(av)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                        >
                          <Settings className="w-4 h-4" />
                          Gerenciar
                        </button>
                        {av.status === 'arquivada' && (
                          <span className="block mt-1 text-[10px] text-yellow-600 font-semibold">Ocultada</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Nenhuma avaliação encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <AdminAvaliacaoModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAvaliacao(null);
        }}
        avaliacao={selectedAvaliacao}
        onSuccess={fetchAvaliacoes}
      />
    </div>
  );
}
