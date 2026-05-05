// Arquivo: frontend/src/app/dashboard/livros/novo/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { BookPlus, Eraser, Search, Loader2, UserPlus } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import AddAutorModal from '@/components/AddAutorModal'; // Importa o componente Modal

// Interface para os dados da categoria
interface Categoria {
  category_id: string;
  name: string;
  descricao?: string | null;
}

// Interface para os dados do autor
interface Autor {
  author_id: string;
  name: string;
  biografia?: string | null;
  data_nascimento?: string | null;
  nacionalidade?: string | null;
}

export default function NovoLivroPage() {
  // Estado geral do formulário
  const [formData, setFormData] = useState({
    titulo: '',
    isbn: '',
    ano_publicacao: '',
    num_paginas: '',
    sinopse: '',
    capa_url: '',
  });

  // --- Estados para busca de Categoria ---
  const [categoriaQuery, setCategoriaQuery] = useState('');
  const debouncedCategoriaQuery = useDebounce(categoriaQuery, 300);
  const [categoriaResults, setCategoriaResults] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [showCategoriaDropdown, setShowCategoriaDropdown] = useState(false);
  const categoriaInputRef = useRef<HTMLInputElement>(null);

  // --- Estados para busca de Autor ---
  const [autorQuery, setAutorQuery] = useState('');
  const debouncedAutorQuery = useDebounce(autorQuery, 300);
  const [autorResults, setAutorResults] = useState<Autor[]>([]);
  const [selectedAutor, setSelectedAutor] = useState<Autor | null>(null);
  const [loadingAutores, setLoadingAutores] = useState(false);
  const [showAutorDropdown, setShowAutorDropdown] = useState(false);
  const autorInputRef = useRef<HTMLInputElement>(null);
  const [showAddAutorOption, setShowAddAutorOption] = useState(false);

  // --- NOVO ESTADO: Controle de visibilidade do Modal ---
  const [isAddAutorModalOpen, setIsAddAutorModalOpen] = useState(false);


  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const router = useRouter();

  // --- Funções Auxiliares ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.currentTarget;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Funções de Categoria (sem alterações) ---
  const handleCategoriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setCategoriaQuery(query);
    setSelectedCategoria(null);
    setShowCategoriaDropdown(true);
    if (!query) setCategoriaResults([]);
  };

  const handleSelectCategoria = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setCategoriaQuery(categoria.name);
    setCategoriaResults([]);
    setShowCategoriaDropdown(false);
  };

  const fetchCategorias = useCallback(async (query: string) => {
    if (!query || selectedCategoria?.name === query) {
        setCategoriaResults([]); setLoadingCategorias(false); return;
    }
    setLoadingCategorias(true); setErro('');
    try {
      const response = await api.get(`/categorias/search`, { params: { nome: query } });
      setCategoriaResults(response.data || []);
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error);
      const msgErroApi = error.response?.data?.mensagem || 'Erro ao buscar categorias.';
      setErro(msgErroApi); setCategoriaResults([]);
    } finally { setLoadingCategorias(false); }
  }, [selectedCategoria]);

  useEffect(() => {
    if (debouncedCategoriaQuery) { fetchCategorias(debouncedCategoriaQuery); }
    else { setCategoriaResults([]); }
  }, [debouncedCategoriaQuery, fetchCategorias]);


  // --- Funções de Autor (com integração do Modal) ---
  const handleAutorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setAutorQuery(query);
    setSelectedAutor(null);
    setShowAutorDropdown(true);
    setShowAddAutorOption(false);
    if (!query) setAutorResults([]);
  };

  const handleSelectAutor = (autor: Autor) => {
    setSelectedAutor(autor);
    setAutorQuery(autor.name);
    setAutorResults([]);
    setShowAutorDropdown(false);
    setShowAddAutorOption(false);
  };

  const fetchAutores = useCallback(async (query: string) => {
    if (!query || selectedAutor?.name === query) {
        setAutorResults([]); setLoadingAutores(false); setShowAddAutorOption(false); return;
    }
    setLoadingAutores(true); setErro(''); setShowAddAutorOption(false);
    try {
      const response = await api.get(`/autores/search`, { params: { nome: query } });
      const results = response.data || [];
      setAutorResults(results);
      // Condição ajustada para só mostrar opção se busca concluída
      if (query && !loadingAutores && results.length === 0) {
        // Atraso pequeno para garantir que setLoadingAutores já está false
        setTimeout(() => setShowAddAutorOption(true), 0);
      }
    } catch (error: any) {
      console.error('Erro ao buscar autores:', error);
      const msgErroApi = error.response?.data?.mensagem || 'Erro ao buscar autores.';
      setErro(msgErroApi); setAutorResults([]); setShowAddAutorOption(false);
    } finally { setLoadingAutores(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAutor]); // Removido loadingAutores para evitar loop

  useEffect(() => {
    // Não busca se o modal estiver aberto (evita buscar enquanto o usuário digita no modal)
    if (debouncedAutorQuery && !isAddAutorModalOpen) {
        fetchAutores(debouncedAutorQuery);
    } else if (!debouncedAutorQuery) {
        setAutorResults([]);
        setShowAddAutorOption(false);
    }
  }, [debouncedAutorQuery, fetchAutores, isAddAutorModalOpen]); // Adiciona isAddAutorModalOpen

  // --- ATUALIZADO: Abre o Modal ---
  const handleAddNovoAutor = () => {
    console.log("Abrindo modal para adicionar:", autorQuery);
    setShowAutorDropdown(false); // Esconde dropdown normal
    setIsAddAutorModalOpen(true); // Abre o modal
  };

  // --- NOVA FUNÇÃO: Chamada pelo Modal após criar o autor ---
  const handleAutorCriado = (novoAutor: Autor) => {
    console.log("Autor criado recebido:", novoAutor);
    setSelectedAutor(novoAutor); // Seleciona o novo autor
    setAutorQuery(novoAutor.name); // Atualiza o input principal
    setAutorResults([]); // Limpa resultados da busca anterior
    setShowAddAutorOption(false); // Esconde a opção de adicionar
    setIsAddAutorModalOpen(false); // Fecha o modal (redundante, pois o modal já fecha, mas garante)
    // Foca no próximo campo, talvez? Ou apenas deixa o usuário continuar.
  };


  // --- Funções do Formulário ---
  const limparFormulario = () => {
    setFormData({ titulo: '', isbn: '', ano_publicacao: '', num_paginas: '', sinopse: '', capa_url: '' });
    setCategoriaQuery(''); setCategoriaResults([]); setSelectedCategoria(null); setShowCategoriaDropdown(false);
    setAutorQuery(''); setAutorResults([]); setSelectedAutor(null); setShowAutorDropdown(false); setShowAddAutorOption(false);
    setIsAddAutorModalOpen(false); // Garante que o modal fecha ao limpar
    setErro(''); setSucesso('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategoria) {
      setErro('Por favor, selecione uma categoria válida da lista.');
      categoriaInputRef.current?.focus(); return;
    }
    if (!selectedAutor) {
      setErro('Por favor, selecione um autor válido da lista ou adicione um novo.');
      autorInputRef.current?.focus(); return;
    }

    setEnviando(true); setErro(''); setSucesso('');

    const dadosParaEnviar = {
      titulo: formData.titulo,
      isbn: formData.isbn,
      ano_publicacao: parseInt(formData.ano_publicacao) || null,
      num_paginas: parseInt(formData.num_paginas) || null,
      sinopse: formData.sinopse,
      capa_url: formData.capa_url,
      category_id: selectedCategoria.category_id,
      author_id: selectedAutor.author_id,
    };

    console.log("Enviando dados:", dadosParaEnviar);

    try {
      await api.post('/livros', dadosParaEnviar);
      setSucesso('Livro cadastrado com sucesso!');
      limparFormulario();
      setTimeout(() => { router.push('/dashboard/livros'); }, 1500);
    } catch (error: any) {
      console.error("Erro no handleSubmit:", error.response?.data || error.message || error);
      const msgErro = error.response?.data?.mensagem || "Erro desconhecido ao cadastrar o livro.";
      setErro(msgErro);
    } finally { setEnviando(false); }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Cadastrar Novo Livro</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título e ISBN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Título do Livro" required className="p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} placeholder="ISBN (Opcional)" className="p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Busca de Autor e Busca de Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input de Busca de Autor */}
            <div className="relative">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                 <input
                    ref={autorInputRef}
                    type="text"
                    name="autor_query"
                    value={autorQuery}
                    onChange={handleAutorChange}
                    onFocus={() => {
                        setShowAutorDropdown(true);
                        if (autorQuery && !loadingAutores && autorResults.length === 0) {
                            setShowAddAutorOption(true);
                        }
                    }}
                    onBlur={() => setTimeout(() => { setShowAutorDropdown(false); }, 200)}
                    placeholder="Buscar Autor..."
                    required={!selectedAutor}
                    className="w-full p-3 pl-10 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    autoComplete="off"
                 />
                 {loadingAutores && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={20} />
                 )}
              </div>

              {/* Dropdown de Resultados do Autor */}
              {showAutorDropdown && (autorQuery || loadingAutores || showAddAutorOption) && !selectedAutor && (
                <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {loadingAutores ? (
                     <li className="px-4 py-2 text-gray-500 italic">Buscando...</li>
                  ) : autorResults.length > 0 ? (
                     autorResults.map((autor) => (
                       <li
                         key={autor.author_id}
                         onMouseDown={() => handleSelectAutor(autor)}
                         className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                       >
                         {autor.name}
                       </li>
                     ))
                  ) : (
                     showAddAutorOption ? (
                        <li
                            onMouseDown={handleAddNovoAutor} // Chama a função que abre o modal
                            className="px-4 py-2 text-blue-600 hover:bg-blue-100 cursor-pointer italic flex items-center gap-2"
                        >
                           <UserPlus size={16} /> Adicionar "{autorQuery}"
                        </li>
                     ) : (
                        autorQuery && <li className="px-4 py-2 text-gray-500 italic">Nenhum autor encontrado.</li>
                     )
                  )}
                </ul>
              )}
            </div>
            {/* Fim do Input Autor */}

            {/* Input de Busca de Categoria */}
            <div className="relative">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                 <input
                    ref={categoriaInputRef}
                    type="text"
                    name="categoria_query"
                    value={categoriaQuery}
                    onChange={handleCategoriaChange}
                    onFocus={() => setShowCategoriaDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCategoriaDropdown(false), 200)}
                    placeholder="Buscar Categoria..."
                    required={!selectedCategoria}
                    className="w-full p-3 pl-10 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    autoComplete="off"
                 />
                 {loadingCategorias && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" size={20} />
                 )}
              </div>

              {/* Dropdown de Resultados da Categoria */}
              {showCategoriaDropdown && (categoriaQuery || loadingCategorias) && !selectedCategoria && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {loadingCategorias ? (
                     <li className="px-4 py-2 text-gray-500 italic">Buscando...</li>
                  ) : categoriaResults.length > 0 ? (
                     categoriaResults.map((categoria) => (
                       <li
                         key={categoria.category_id}
                         onMouseDown={() => handleSelectCategoria(categoria)}
                         className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                       >
                         <span className="font-medium">{categoria.name}</span>
                         {categoria.descricao && (
                           <p className="text-xs text-gray-500 mt-1">{categoria.descricao}</p>
                         )}
                       </li>
                     ))
                  ) : (
                     categoriaQuery && <li className="px-4 py-2 text-gray-500 italic">Nenhuma categoria encontrada.</li>
                  )}
                </ul>
              )}
            </div>
             {/* Fim do Input Categoria */}
          </div>

          {/* Ano e Páginas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="number" name="ano_publicacao" value={formData.ano_publicacao} onChange={handleChange} placeholder="Ano de Publicação (Opcional)" className="p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input type="number" name="num_paginas" value={formData.num_paginas} onChange={handleChange} placeholder="Nº de Páginas (Opcional)" className="p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Capa e Sinopse */}
          <input type="text" name="capa_url" value={formData.capa_url} onChange={handleChange} placeholder="URL da Imagem da Capa (Opcional)" className="w-full p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          <textarea name="sinopse" value={formData.sinopse} onChange={handleChange} placeholder="Sinopse (Opcional)..." rows={4} className="w-full p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>

          {/* Feedback */}
          {erro && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-center">{erro}</p>}
          {sucesso && <p className="text-green-600 bg-green-100 p-3 rounded-lg text-center">{sucesso}</p>}

          {/* Botões */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button type="button" onClick={limparFormulario} className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
              <Eraser size={18} /> Limpar
            </button>
            <button type="submit" disabled={enviando || !selectedCategoria || !selectedAutor} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
              <BookPlus size={18} /> {enviando ? 'Cadastrando...' : 'Cadastrar Livro'}
            </button>
          </div>
        </form>

         {/* Renderiza o Modal de Adicionar Autor */}
         <AddAutorModal
             isOpen={isAddAutorModalOpen}
             onClose={() => setIsAddAutorModalOpen(false)}
             onAutorCreated={handleAutorCriado} // Passa a função callback
             initialName={autorQuery} // Passa o nome digitado para o modal
         />

      </div>
  );
}

