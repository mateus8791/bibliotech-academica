import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import api from '@/services/api';
import { Save, Search, Loader2, UserPlus, LoaderCircle, X, Hash, Calendar, FileText, Image as ImageIcon, AlignLeft } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import AddAutorModal from '@/components/AddAutorModal';
import GoogleBooksSearchModal from '@/components/dashboard/GoogleBooksSearchModal';

interface Categoria {
  category_id: string;
  name: string;
  descricao?: string | null;
}

interface Autor {
  author_id: string;
  name: string;
}

interface EditarLivroModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string | null;
  onSuccess: () => void;
}

export default function EditarLivroModal({ isOpen, onClose, bookId, onSuccess }: EditarLivroModalProps) {
  const [formData, setFormData] = useState({
    titulo: '',
    isbn: '',
    ano_publicacao: '',
    num_paginas: '',
    sinopse: '',
    capa_url: '',
  });

  const [categoriaQuery, setCategoriaQuery] = useState('');
  const debouncedCategoriaQuery = useDebounce(categoriaQuery, 300);
  const [categoriaResults, setCategoriaResults] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [showCategoriaDropdown, setShowCategoriaDropdown] = useState(false);
  const categoriaInputRef = useRef<HTMLInputElement>(null);

  const [autorQuery, setAutorQuery] = useState('');
  const debouncedAutorQuery = useDebounce(autorQuery, 300);
  const [autorResults, setAutorResults] = useState<Autor[]>([]);
  const [selectedAutor, setSelectedAutor] = useState<Autor | null>(null);
  const [loadingAutores, setLoadingAutores] = useState(false);
  const [showAutorDropdown, setShowAutorDropdown] = useState(false);
  const autorInputRef = useRef<HTMLInputElement>(null);
  const [showAddAutorOption, setShowAddAutorOption] = useState(false);

  const [isAddAutorModalOpen, setIsAddAutorModalOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const [carregandoDados, setCarregandoDados] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [tituloOriginal, setTituloOriginal] = useState('');

  const handleGoogleBookSelect = (book: any) => {
    setFormData({
      titulo: book.titulo || '',
      isbn: book.isbn || '',
      ano_publicacao: book.ano_publicacao || '',
      num_paginas: book.numero_paginas?.toString() || '',
      sinopse: book.descricao || '',
      capa_url: book.capa_url || ''
    });
    if (book.autores && book.autores.length > 0) {
      setAutorQuery(book.autores[0]);
    }
    setIsGoogleModalOpen(false);
  };

  // Reset states and fetch data when opened
  useEffect(() => {
    if (!isOpen || !bookId) return;

    const fetchBook = async () => {
      try {
        setCarregandoDados(true);
        setErro('');
        const response = await api.get(`/livros/${bookId}`);
        const bookData = response.data;

        setFormData({
            titulo: bookData.titulo || '',
            isbn: bookData.isbn || '',
            ano_publicacao: bookData.ano_publicacao?.toString() || '',
            num_paginas: bookData.num_paginas?.toString() || '',
            sinopse: bookData.sinopse || '',
            capa_url: bookData.capa_url || '',
        });
        setTituloOriginal(bookData.titulo || '');

        if (bookData.autores && bookData.autores.length > 0) {
            const autor = bookData.autores[0];
            setSelectedAutor({ author_id: autor.id, name: autor.nome });
            setAutorQuery(autor.nome);
        } else {
            setSelectedAutor(null);
            setAutorQuery('');
        }

        if (bookData.categorias && bookData.categorias.length > 0) {
            const categoria = bookData.categorias[0];
            setSelectedCategoria({ category_id: categoria.id, name: categoria.nome });
            setCategoriaQuery(categoria.nome);
        } else {
            setSelectedCategoria(null);
            setCategoriaQuery('');
        }
      } catch (e) {
        setErro('Não foi possível carregar os dados do livro.');
      } finally {
        setCarregandoDados(false);
      }
    };

    fetchBook();
  }, [isOpen, bookId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.currentTarget;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
    } catch (e) {
      setCategoriaResults([]);
    } finally { setLoadingCategorias(false); }
  }, [selectedCategoria]);

  useEffect(() => {
    if (debouncedCategoriaQuery) fetchCategorias(debouncedCategoriaQuery);
    else setCategoriaResults([]);
  }, [debouncedCategoriaQuery, fetchCategorias]);

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
      if (query && !loadingAutores && results.length === 0) {
        setTimeout(() => setShowAddAutorOption(true), 0);
      }
    } catch (e) {
      setAutorResults([]); setShowAddAutorOption(false);
    } finally { setLoadingAutores(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAutor]);

  useEffect(() => {
    if (debouncedAutorQuery && !isAddAutorModalOpen) {
        fetchAutores(debouncedAutorQuery);
    } else if (!debouncedAutorQuery) {
        setAutorResults([]);
        setShowAddAutorOption(false);
    }
  }, [debouncedAutorQuery, fetchAutores, isAddAutorModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategoria) {
      setErro('Selecione uma categoria válida.');
      categoriaInputRef.current?.focus(); return;
    }
    if (!selectedAutor) {
      setErro('Selecione um autor válido.');
      autorInputRef.current?.focus(); return;
    }

    setEnviando(true); setErro('');

    const dadosParaEnviar = {
      titulo: formData.titulo,
      isbn: formData.isbn,
      ano_publicacao: parseInt(formData.ano_publicacao) || null,
      num_paginas: parseInt(formData.num_paginas) || null,
      sinopse: formData.sinopse,
      capa_url: formData.capa_url,
      categorias_ids: [selectedCategoria.category_id],
      autores_ids: [selectedAutor.author_id],
    };

    try {
      await api.put(`/livros/${bookId}`, dadosParaEnviar);
      onSuccess();
    } catch (error: unknown) {
      const err = error as any;
      setErro(err.response?.data?.mensagem || "Erro ao atualizar o livro.");
    } finally { setEnviando(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
            <div>
                <h2 className="text-xl font-bold text-gray-800">Editar Livro</h2>
                {!carregandoDados && tituloOriginal && (
                    <p className="text-sm text-gray-500 mt-1">Atualizando <span className="font-semibold text-blue-600">{tituloOriginal}</span></p>
                )}
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
            {carregandoDados ? (
                <div className="flex flex-col justify-center items-center h-64 text-gray-500">
                    <LoaderCircle className="animate-spin text-blue-600 mb-4" size={32}/>
                    <span className="text-lg font-medium">Carregando informações...</span>
                </div>
            ) : (
                <form id="edit-livro-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Imagem + Informações Principais */}
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Preview da Capa */}
                    <div className="w-full md:w-1/3 flex flex-col items-center">
                        <div className="w-48 h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden mb-4 shadow-sm relative group">
                            {formData.capa_url ? (
                                <Image src={formData.capa_url} alt="Preview da Capa" fill className="object-cover" />
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <ImageIcon size={32} className="mb-2" />
                                    <span className="text-xs">Sem Capa</span>
                                </div>
                            )}
                        </div>
                        <div className="w-full space-y-2">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">URL da Imagem</label>
                            <input type="text" name="capa_url" value={formData.capa_url} onChange={handleChange} placeholder="https://..."
                                className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none" />
                        </div>
                    </div>

                    {/* Campos Principais */}
                    <div className="w-full md:w-2/3 space-y-6">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-700">Título do Livro <span className="text-red-500">*</span></label>
                            <button
                                type="button"
                                onClick={() => setIsGoogleModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors border border-indigo-100 shadow-sm"
                            >
                                <Search size={14} /> Buscar Dados via Google Books
                            </button>
                        </div>
                        <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required 
                            className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Autor */}
                            <div className="space-y-2 relative">
                                <label className="text-sm font-semibold text-gray-700">Autor Principal <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input ref={autorInputRef} type="text" value={autorQuery} onChange={handleAutorChange}
                                        onFocus={() => {
                                            setShowAutorDropdown(true);
                                            if (autorQuery && !loadingAutores && autorResults.length === 0) setShowAddAutorOption(true);
                                        }}
                                        onBlur={() => setTimeout(() => setShowAutorDropdown(false), 200)}
                                        placeholder="Buscar Autor..." required={!selectedAutor}
                                        className="w-full p-3 pl-9 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800 text-sm" autoComplete="off" />
                                    {loadingAutores && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin" size={16} />}
                                </div>
                                
                                {showAutorDropdown && (autorQuery || loadingAutores || showAddAutorOption) && !selectedAutor && (
                                    <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2">
                                    {loadingAutores ? (
                                        <li className="px-4 py-2 text-gray-500 text-xs flex items-center gap-2"><Loader2 className="animate-spin" size={14}/> Buscando...</li>
                                    ) : autorResults.length > 0 ? (
                                        autorResults.map((autor) => (
                                        <li key={autor.author_id} onMouseDown={() => handleSelectAutor(autor)}
                                            className="px-4 py-2 hover:bg-blue-50 text-gray-700 cursor-pointer text-sm font-medium transition-colors">
                                            {autor.name}
                                        </li>
                                        ))
                                    ) : (
                                        showAddAutorOption ? (
                                            <li onMouseDown={() => { setShowAutorDropdown(false); setIsAddAutorModalOpen(true); }}
                                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-sm font-semibold transition-colors">
                                            <UserPlus size={14} /> Adicionar &quot;{autorQuery}&quot;
                                            </li>
                                        ) : (
                                            autorQuery && <li className="px-4 py-2 text-gray-500 text-xs">Nenhum autor encontrado.</li>
                                        )
                                    )}
                                    </ul>
                                )}
                            </div>

                            {/* Categoria */}
                            <div className="space-y-2 relative">
                                <label className="text-sm font-semibold text-gray-700">Categoria <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input ref={categoriaInputRef} type="text" value={categoriaQuery} onChange={handleCategoriaChange}
                                        onFocus={() => setShowCategoriaDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowCategoriaDropdown(false), 200)}
                                        placeholder="Buscar Categoria..." required={!selectedCategoria}
                                        className="w-full p-3 pl-9 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800 text-sm" autoComplete="off" />
                                    {loadingCategorias && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin" size={16} />}
                                </div>

                                {showCategoriaDropdown && (categoriaQuery || loadingCategorias) && !selectedCategoria && (
                                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2">
                                    {loadingCategorias ? (
                                        <li className="px-4 py-2 text-gray-500 text-xs flex items-center gap-2"><Loader2 className="animate-spin" size={14}/> Buscando...</li>
                                    ) : categoriaResults.length > 0 ? (
                                        categoriaResults.map((categoria) => (
                                        <li key={categoria.category_id} onMouseDown={() => handleSelectCategoria(categoria)}
                                            className="px-4 py-2 hover:bg-blue-50 text-gray-700 cursor-pointer transition-colors group">
                                            <div className="font-medium text-sm">{categoria.name}</div>
                                        </li>
                                        ))
                                    ) : (
                                        categoriaQuery && <li className="px-4 py-2 text-gray-500 text-xs">Nenhuma categoria encontrada.</li>
                                    )}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Hash size={14} className="text-gray-400"/> ISBN
                                </label>
                                <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} placeholder="Opcional"
                                    className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400"/> Ano
                                </label>
                                <input type="number" name="ano_publicacao" value={formData.ano_publicacao} onChange={handleChange} placeholder="Opcional"
                                    className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FileText size={14} className="text-gray-400"/> Páginas
                                </label>
                                <input type="number" name="num_paginas" value={formData.num_paginas} onChange={handleChange} placeholder="Opcional"
                                    className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800 text-sm" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <AlignLeft size={14} className="text-gray-400"/> Sinopse
                            </label>
                            <textarea name="sinopse" value={formData.sinopse} onChange={handleChange} placeholder="Breve resumo da obra (Opcional)..." rows={4}
                                className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800 text-sm resize-y"></textarea>
                        </div>
                    </div>
                </div>

                {erro && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl flex items-center gap-3">
                        <p className="text-sm font-medium">{erro}</p>
                    </div>
                )}
                </form>
            )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
                Cancelar
            </button>
            <button form="edit-livro-form" type="submit" disabled={enviando || !selectedCategoria || !selectedAutor || carregandoDados}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus:ring-4 focus:ring-blue-500/20 disabled:bg-blue-300 disabled:shadow-none transition-all">
                {enviando ? (
                    <><Loader2 size={16} className="animate-spin" /> Salvando...</>
                ) : (
                    <><Save size={16} /> Salvar Alterações</>
                )}
            </button>
        </div>
      </div>

      {/* Reutiliza o Modal de Adicionar Autor (agora com z-index ainda maior se necessário) */}
      <AddAutorModal
        isOpen={isAddAutorModalOpen}
        onClose={() => setIsAddAutorModalOpen(false)}
        onAutorCreated={(novoAutor) => {
            setSelectedAutor(novoAutor);
            setAutorQuery(novoAutor.name);
            setAutorResults([]);
            setShowAddAutorOption(false);
            setIsAddAutorModalOpen(false);
        }}
        initialName={autorQuery}
      />

      <GoogleBooksSearchModal 
          isOpen={isGoogleModalOpen}
          onClose={() => setIsGoogleModalOpen(false)}
          onSelectBook={handleGoogleBookSelect}
      />
    </div>
  );
}
