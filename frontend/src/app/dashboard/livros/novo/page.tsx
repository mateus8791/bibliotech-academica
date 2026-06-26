// Arquivo: frontend/src/app/dashboard/livros/novo/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { BookPlus, Eraser, Search, Loader2, UserPlus, BookOpen, Hash, Calendar, FileText, Image as ImageIcon, AlignLeft, ArrowLeft } from 'lucide-react';
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
  biografia?: string | null;
  data_nascimento?: string | null;
  nacionalidade?: string | null;
}

export default function NovoLivroPage() {
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

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const router = useRouter();

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
    } catch (error) {
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
    } catch (error) {
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

  const limparFormulario = () => {
    setFormData({ titulo: '', isbn: '', ano_publicacao: '', num_paginas: '', sinopse: '', capa_url: '' });
    setCategoriaQuery(''); setCategoriaResults([]); setSelectedCategoria(null); setShowCategoriaDropdown(false);
    setAutorQuery(''); setAutorResults([]); setSelectedAutor(null); setShowAutorDropdown(false); setShowAddAutorOption(false);
    setIsAddAutorModalOpen(false);
    setErro(''); setSucesso('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategoria) {
      setErro('Selecione uma categoria válida da lista.');
      categoriaInputRef.current?.focus(); return;
    }
    if (!selectedAutor) {
      setErro('Selecione um autor válido da lista.');
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

    try {
      await api.post('/livros', dadosParaEnviar);
      setSucesso('Livro cadastrado com sucesso!');
      setTimeout(() => router.push('/dashboard/livros'), 1500);
    } catch (error: any) {
      setErro(error.response?.data?.mensagem || "Erro ao cadastrar o livro.");
    } finally { setEnviando(false); }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
        {/* Header Section */}
        <div className="mb-8 flex items-center space-x-4">
            <button 
                onClick={() => router.push('/dashboard/livros')}
                className="p-2 bg-white text-gray-500 hover:text-blue-600 rounded-full shadow-sm hover:shadow-md transition-all border border-gray-100"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cadastrar Novo Livro</h1>
                <p className="text-sm text-gray-500 mt-1">Preencha os detalhes do acervo da biblioteca.</p>
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            {/* Form Header Accent */}
            <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            
            <div className="p-8 sm:p-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <BookOpen size={20} className="text-blue-500"/> Informações Principais
                        </h3>
                        <button
                            type="button"
                            onClick={() => setIsGoogleModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors border border-indigo-100 shadow-sm"
                        >
                            <Search size={16} /> Buscar Dados via Google Books
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Título do Livro <span className="text-red-500">*</span></label>
                            <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required 
                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Hash size={16} className="text-gray-400"/> ISBN
                            </label>
                            <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} placeholder="Opcional"
                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800" />
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Classificação */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <UserPlus size={20} className="text-blue-500"/> Autoria e Categoria
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Autor */}
                        <div className="space-y-2 relative">
                            <label className="text-sm font-semibold text-gray-700">Autor Principal <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input ref={autorInputRef} type="text" value={autorQuery} onChange={handleAutorChange}
                                    onFocus={() => {
                                        setShowAutorDropdown(true);
                                        if (autorQuery && !loadingAutores && autorResults.length === 0) setShowAddAutorOption(true);
                                    }}
                                    onBlur={() => setTimeout(() => setShowAutorDropdown(false), 200)}
                                    placeholder="Buscar Autor..." required={!selectedAutor}
                                    className="w-full p-3.5 pl-10 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800" autoComplete="off" />
                                {loadingAutores && <Loader2 className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin" size={18} />}
                            </div>
                            
                            {showAutorDropdown && (autorQuery || loadingAutores || showAddAutorOption) && !selectedAutor && (
                                <ul className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2">
                                {loadingAutores ? (
                                    <li className="px-4 py-3 text-gray-500 text-sm flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Buscando...</li>
                                ) : autorResults.length > 0 ? (
                                    autorResults.map((autor) => (
                                    <li key={autor.author_id} onMouseDown={() => handleSelectAutor(autor)}
                                        className="px-4 py-2.5 hover:bg-blue-50 text-gray-700 cursor-pointer text-sm font-medium transition-colors">
                                        {autor.name}
                                    </li>
                                    ))
                                ) : (
                                    showAddAutorOption ? (
                                        <li onMouseDown={() => { setShowAutorDropdown(false); setIsAddAutorModalOpen(true); }}
                                            className="px-4 py-3 text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-sm font-semibold transition-colors">
                                        <UserPlus size={16} /> Adicionar "{autorQuery}"
                                        </li>
                                    ) : (
                                        autorQuery && <li className="px-4 py-3 text-gray-500 text-sm">Nenhum autor encontrado.</li>
                                    )
                                )}
                                </ul>
                            )}
                        </div>

                        {/* Categoria */}
                        <div className="space-y-2 relative">
                            <label className="text-sm font-semibold text-gray-700">Categoria <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input ref={categoriaInputRef} type="text" value={categoriaQuery} onChange={handleCategoriaChange}
                                    onFocus={() => setShowCategoriaDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowCategoriaDropdown(false), 200)}
                                    placeholder="Buscar Categoria..." required={!selectedCategoria}
                                    className="w-full p-3.5 pl-10 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800" autoComplete="off" />
                                {loadingCategorias && <Loader2 className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin" size={18} />}
                            </div>

                            {showCategoriaDropdown && (categoriaQuery || loadingCategorias) && !selectedCategoria && (
                                <ul className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2">
                                {loadingCategorias ? (
                                    <li className="px-4 py-3 text-gray-500 text-sm flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Buscando...</li>
                                ) : categoriaResults.length > 0 ? (
                                    categoriaResults.map((categoria) => (
                                    <li key={categoria.category_id} onMouseDown={() => handleSelectCategoria(categoria)}
                                        className="px-4 py-2.5 hover:bg-blue-50 text-gray-700 cursor-pointer transition-colors group">
                                        <div className="font-medium text-sm">{categoria.name}</div>
                                        {categoria.descricao && <p className="text-xs text-gray-400 mt-0.5 group-hover:text-gray-500">{categoria.descricao}</p>}
                                    </li>
                                    ))
                                ) : (
                                    categoriaQuery && <li className="px-4 py-3 text-gray-500 text-sm">Nenhuma categoria encontrada.</li>
                                )}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Detalhes Físicos */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-blue-500"/> Detalhes da Edição
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400"/> Ano de Publicação
                            </label>
                            <input type="number" name="ano_publicacao" value={formData.ano_publicacao} onChange={handleChange} placeholder="Opcional"
                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <FileText size={16} className="text-gray-400"/> Número de Páginas
                            </label>
                            <input type="number" name="num_paginas" value={formData.num_paginas} onChange={handleChange} placeholder="Opcional"
                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800" />
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Mídia e Resumo */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <ImageIcon size={20} className="text-blue-500"/> Mídia & Sinopse
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">URL da Capa</label>
                            <input type="text" name="capa_url" value={formData.capa_url} onChange={handleChange} placeholder="https://..."
                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <AlignLeft size={16} className="text-gray-400"/> Sinopse
                            </label>
                            <textarea name="sinopse" value={formData.sinopse} onChange={handleChange} placeholder="Breve resumo da obra (Opcional)..." rows={4}
                                className="w-full p-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none text-gray-800 resize-y"></textarea>
                        </div>
                    </div>
                </div>

                {/* Mensagens Feedback */}
                {erro && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3">
                        <p className="text-sm font-medium">{erro}</p>
                    </div>
                )}
                {sucesso && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3">
                        <BookPlus size={20} className="text-green-500" />
                        <p className="text-sm font-medium">{sucesso}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                    <button type="button" onClick={limparFormulario}
                        className="px-6 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2">
                        <Eraser size={18} /> Limpar
                    </button>
                    <button type="submit" disabled={enviando || !selectedCategoria || !selectedAutor}
                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus:ring-4 focus:ring-blue-500/20 disabled:bg-gray-300 disabled:shadow-none transition-all">
                        {enviando ? (
                            <><Loader2 size={18} className="animate-spin" /> Cadastrando...</>
                        ) : (
                            <><BookPlus size={18} /> Cadastrar Livro</>
                        )}
                    </button>
                </div>

                </form>
            </div>
        </div>

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
