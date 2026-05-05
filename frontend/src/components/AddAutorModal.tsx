import * as React from 'react'; // <--- CORREÇÃO AQUI
import { useState } from 'react';
import api from '@/services/api';
import { X, Save, Loader2 } from 'lucide-react';

interface AddAutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutorCreated: (newAutor: Autor) => void;
  initialName?: string;
}

// Interface para dados do Autor (pode ser movida para um arquivo de tipos)
interface Autor {
  author_id: string;
  name: string;
  biografia?: string | null;
  data_nascimento?: string | null;
  nacionalidade?: string | null;
}

const AddAutorModal: React.FC<AddAutorModalProps> = ({ isOpen, onClose, onAutorCreated, initialName = '' }) => {
  const [formData, setFormData] = useState({
    name: initialName,
    biografia: '',
    data_nascimento: '',
    nacionalidade: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Atualiza estado do formulário do modal
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Resetar formulário
  const resetForm = React.useCallback(() => { // Usar useCallback se for dependência de useEffect
    setFormData({ name: initialName, biografia: '', data_nascimento: '', nacionalidade: '' });
    setError('');
    setLoading(false);
  }, [initialName]); // Adiciona initialName como dependência

   // Resetar quando o nome inicial mudar (se o modal for reutilizado)
   React.useEffect(() => {
     if (isOpen) { // Apenas reseta se estiver aberto e initialName mudar
        setFormData(prev => ({ ...prev, name: initialName }));
     }
   }, [initialName, isOpen]);


  // Lida com o fechamento
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Envia dados para criar autor
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('O nome do autor é obrigatório.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Usa os dados do estado formData
      const response = await api.post('/autores', formData);
      const novoAutorCriado: Autor = response.data;
      onAutorCreated(novoAutorCriado);
      handleClose();

    } catch (err: any) {
      console.error("Erro ao criar autor:", err.response?.data || err.message);
      setError(err.response?.data?.mensagem || 'Falha ao cadastrar autor. Verifique os dados.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Overlay
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      {/* Conteúdo do Modal */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        {/* Botão de Fechar */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          aria-label="Fechar modal"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Adicionar Novo Autor</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="modal-autor-name" className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              id="modal-autor-name" // ID único para o label
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Nome completo do autor"
            />
          </div>
          <div>
            <label htmlFor="modal-autor-biografia" className="block text-sm font-medium text-gray-700 mb-1">Biografia (Opcional)</label>
            <textarea
              id="modal-autor-biografia"
              name="biografia"
              value={formData.biografia}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Breve biografia..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modal-autor-data_nascimento" className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento (Opcional)</label>
              <input
                type="date"
                id="modal-autor-data_nascimento"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="modal-autor-nacionalidade" className="block text-sm font-medium text-gray-700 mb-1">Nacionalidade (Opcional)</label>
              <input
                type="text"
                id="modal-autor-nacionalidade"
                name="nacionalidade"
                value={formData.nacionalidade}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Brasileira, Americana"
              />
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded text-center">{error}</p>}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {loading ? 'Salvando...' : 'Salvar Autor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAutorModal;