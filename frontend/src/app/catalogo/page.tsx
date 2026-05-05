// Arquivo: frontend/src/app/catalogo/page.tsx (Versão Atualizada com Filtros e Carrossel)
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, LoaderCircle, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';

import api from '@/services/api';
import BookCard from '@/components/BookCard';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import TopReadsCarousel from '@/components/catalogo/TopReadsCarousel';
import AdvancedFilters from '@/components/catalogo/AdvancedFilters';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { mockCategories, mockAuthors, mockTopReads } from '@/lib/mock-data';
import type { Livro as LivroCarousel } from '@/lib/schemas';
import { resolveCapaUrl } from '@/lib/resolveCapaUrl';

interface Autor {
  id: number;
  nome: string;
  foto_url?: string | null;
}

// Tipo local usado apenas para o grid de livros (vem diretamente do backend)
interface Livro {
  id: string;
  titulo: string;
  capa_url: string | null;
  autores?: Autor[] | string | null;
  autores_nomes?: string | null;
}

interface Category {
  category_id: number;
  name: string;
  descricao?: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

function CatalogoContent() {
  const { usuario } = useAuth();
  const [livros, setLivros] = useState<Livro[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topReads, setTopReads] = useState<LivroCarousel[]>([]); // Livros para o carrossel
  const [termoBusca, setTermoBusca] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const termoBuscaDebounced = useDebounce(termoBusca, 500);

  // Carregar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Tenta buscar categorias do backend
        const response = await api.get('/categorias/publico');
        if (Array.isArray(response.data)) {
          setCategories(response.data);
        }
      } catch (error) {
        // Se der erro 403 ou qualquer outro, usa dados mock
        console.log('Usando categorias mock (backend indisponível ou erro de permissão)');
        setCategories(mockCategories);
      }
    };

    fetchCategories();
  }, []);

  // Carregar livros para o carrossel "Mais Lidos"
  useEffect(() => {
    const fetchTopReads = async () => {
      try {
        // Busca os primeiros 6 livros reais do backend
        const response = await api.get('/livros?limit=6&orderBy=emprestimos');

        const mapLivro = (livro: any): LivroCarousel => ({
          id: String(livro.id),
          titulo: livro.titulo,
          capa_url: resolveCapaUrl(livro.capa_url),
          autores_nomes: Array.isArray(livro.autores)
            ? livro.autores.map((a: Autor) => a.nome).join(', ')
            : (livro.autores_nomes ?? null),
          num_emprestimos: livro.num_emprestimos ?? 0,
          categoria: livro.categoria ?? livro.categorias_nomes ?? undefined,
          categoria_id: livro.categoria_id ?? undefined,
          ano: livro.ano_publicacao ?? undefined,
          isbn: livro.isbn ?? undefined,
          descricao: livro.sinopse ?? undefined,
        });

        if (Array.isArray(response.data)) {
          setTopReads(response.data.slice(0, 6).map(mapLivro));
          console.log('✅ Carrossel carregado com livros reais do backend');
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setTopReads(response.data.data.slice(0, 6).map(mapLivro));
          console.log('✅ Carrossel carregado com livros reais do backend');
        }
      } catch (error) {
        console.log('⚠️ Erro ao carregar livros para carrossel — usando dados mock.');
        setTopReads(mockTopReads);
      }
    };

    fetchTopReads();
  }, []);

  const buscarLivros = useCallback(async (pageToFetch: number) => {
    try {
      setCarregando(true);
      const params = new URLSearchParams();

      if (termoBuscaDebounced) {
        params.append('search', termoBuscaDebounced);
      }

      if (selectedCategory) {
        params.append('categoria', selectedCategory.toString());
      }

      if (selectedAuthor) {
        params.append('autor', selectedAuthor);
      }

      params.append('page', pageToFetch.toString());
      params.append('limit', '20'); // Força 20 itens por página

      console.log(`🔍 Buscando livros - Página ${pageToFetch}`);
      console.log(`📋 URL completa: /livros?${params.toString()}`);

      const response = await api.get(`/livros?${params.toString()}`);

      console.log(`✅ Resposta recebida - ${response.data.data?.length || response.data?.length || 0} livros, paginação:`, response.data.pagination);

      // Handle paginated response
      if (response.data.data && Array.isArray(response.data.data)) {
        // Processar autores para garantir compatibilidade
        const livrosProcessados = response.data.data.map((livro: any) => ({
          ...livro,
          capa_url: resolveCapaUrl(livro.capa_url),
          autores_nomes: Array.isArray(livro.autores)
            ? livro.autores.map((a: Autor) => a.nome).join(', ')
            : livro.autores_nomes || null
        }));
        setLivros(livrosProcessados);
        setPagination(response.data.pagination);
      } else if (Array.isArray(response.data)) {
        // Fallback: Backend retornou array simples sem paginação
        // Processar autores
        const livrosProcessados = response.data.map((livro: any) => ({
          ...livro,
          capa_url: resolveCapaUrl(livro.capa_url),
          autores_nomes: Array.isArray(livro.autores)
            ? livro.autores.map((a: Autor) => a.nome).join(', ')
            : livro.autores_nomes || null
        }));

        console.log('⚠️ Backend retornou array simples (sem paginação). Total de livros:', livrosProcessados.length);

        // Backend retornou todos os livros sem paginação - dividir no cliente
        const itemsPerPage = 20;
        const totalLivros = livrosProcessados.length;
        const totalPages = Math.ceil(totalLivros / itemsPerPage);

        // Usar pageToFetch, não pagination.currentPage!
        const startIndex = (pageToFetch - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const livrosPaginados = livrosProcessados.slice(startIndex, endIndex);

        console.log(`📄 Página ${pageToFetch}: livros ${startIndex + 1} a ${Math.min(endIndex, totalLivros)}`);

        setLivros(livrosPaginados);
        setPagination({
          currentPage: pageToFetch,
          totalPages: totalPages,
          totalItems: totalLivros,
          itemsPerPage: itemsPerPage,
          hasNextPage: pageToFetch < totalPages,
          hasPreviousPage: pageToFetch > 1
        });
      }

      setErro(null);
    } catch (error) {
      console.error("Erro ao buscar livros:", error);
      setErro("Não foi possível carregar os livros.");
    } finally {
      setCarregando(false);
    }
  }, [termoBuscaDebounced, selectedCategory, selectedAuthor]);

  useEffect(() => {
    buscarLivros(pagination.currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, termoBuscaDebounced, selectedCategory, selectedAuthor]);

  const handleDeleteLivro = (idDoLivroApagado: string) => {
    setLivros(livrosAtuais => livrosAtuais.filter(livro => livro.id !== idDoLivroApagado));
  };

  const handlePageChange = (newPage: number) => {
    console.log(`📄 Mudando para página ${newPage}`);
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleAuthorFilter = (author: string | null) => {
    setSelectedAuthor(author);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedAuthor(null);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <button
          key="first"
          onClick={() => handlePageChange(1)}
          className="min-w-[40px] h-10 text-sm font-medium rounded-lg transition-all duration-200 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-300 dark:border-gray-600"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="dots1" className="px-2 text-gray-500 dark:text-gray-400">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`min-w-[40px] h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
            i === pagination.currentPage
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white shadow-lg scale-110 border-2 border-blue-400'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-300 dark:border-gray-600'
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        buttons.push(<span key="dots2" className="px-2 text-gray-500 dark:text-gray-400">...</span>);
      }
      buttons.push(
        <button
          key="last"
          onClick={() => handlePageChange(pagination.totalPages)}
          className="min-w-[40px] h-10 text-sm font-medium rounded-lg transition-all duration-200 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-300 dark:border-gray-600"
        >
          {pagination.totalPages}
        </button>
      );
    }

    return buttons;
  };

  return (
      <div className="p-6 md:p-8">

        {usuario && (
          <div className="flex items-center gap-4 mb-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm transition-colors duration-200">
            <Image
              src={usuario.foto_url || '/avatar-placeholder.png'}
              alt={`Foto de ${usuario.nome}`}
              width={56}
              height={56}
              className="rounded-full object-cover border-2 border-blue-500 dark:border-blue-400"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Boas-vindas, {usuario.nome.split(' ')[0]}!</h1>
              <p className="text-gray-500 dark:text-gray-400">Pronto para sua próxima aventura literária?</p>
            </div>
          </div>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Busque por título ou autor..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-200"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>

        {/* --- BANNER HERO --- */}
        {/* Só aparece se a busca estiver vazia e não estiver carregando */}
        {!termoBusca && !carregando && (
          <div className="relative bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-950 dark:to-black rounded-2xl p-8 md:p-12 mb-12 overflow-hidden text-white flex items-center min-h-[250px] transition-colors duration-200">
            <div className="relative z-10 md:w-1/2">
              <h2 className="text-sm uppercase tracking-widest text-amber-400 font-semibold">Leitura em Destaque</h2>
              <h3 className="text-3xl md:text-5xl font-bold mt-2">Elementar, meu caro leitor</h3>
              <p className="mt-4 text-gray-300 max-w-lg">Mergulhe nos mistérios de Baker Street com a coleção completa de Sherlock Holmes.</p>
              <button
                onClick={() => setTermoBusca('Sherlock Holmes')}
                className="mt-6 bg-amber-500 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 transition-transform hover:scale-105"
              >
                Ver coleção
              </button>
            </div>

            <div className="absolute right-0 top-0 h-full w-full opacity-5 md:opacity-100 md:w-1/2 pointer-events-none">
              <Image
                src="/covers/sherlock-profile.png"
                alt="Silhueta de Sherlock Holmes"
                fill
                style={{ objectFit: 'contain', objectPosition: 'bottom right' }}
              />
            </div>
            <div className="absolute right-[5%] top-1/2 -translate-y-1/2 hidden md:block pointer-events-none">
              <Image
                src="/covers/sherlock-cover.jpg"
                alt="Capa do livro de Sherlock Holmes"
                width={150}
                height={220}
                className="rounded-lg shadow-2xl rotate-6"
              />
            </div>
          </div>
        )}

        {/* --- CARROSSEL DE MAIS LIDOS --- */}
        {/* Só aparece se não houver busca ativa */}
        {!termoBusca && !selectedCategory && !selectedAuthor && topReads.length > 0 && (
          <TopReadsCarousel livros={topReads} />
        )}

        {/* --- FILTROS AVANÇADOS --- */}
        <AdvancedFilters
          categories={categories.length > 0 ? categories : mockCategories}
          authors={mockAuthors}
          selectedCategory={selectedCategory}
          selectedAuthor={selectedAuthor}
          onCategoryChange={handleCategoryFilter}
          onAuthorChange={handleAuthorFilter}
          onClearFilters={handleClearFilters}
        />

        {/* Grid de Livros */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">
              {/* O título muda se houver uma busca ativa */}
              {termoBusca ? `Resultados para "${termoBusca}"` : 'Nosso Acervo'}
            </h2>
            {usuario?.tipo_usuario === 'bibliotecario' && (
              <Link href="/dashboard/livros/novo" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                <PlusCircle size={18} /> Adicionar Livro
              </Link>
            )}
          </div>
          {carregando ? (
            <div className="text-center text-gray-500 dark:text-gray-400 flex items-center justify-center p-10">
              <LoaderCircle className="animate-spin mr-2" /> Buscando...
            </div>
          ) : erro ? (
            <div className="text-center text-red-500 dark:text-red-400 p-10">{erro}</div>
          ) : livros.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {livros.map(livro => (
                  <BookCard key={livro.id} livro={{...livro, autores: livro.autores_nomes || null}} onDelete={handleDeleteLivro} />
                ))}
              </div>

              {/* Paginação - sempre mostrar se houver 20 itens (página cheia) */}
              {(pagination.totalPages > 1 || livros.length >= 20) && (
                <div className="mt-12 flex flex-col items-center gap-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {renderPaginationButtons()}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage && livros.length < 20}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                    >
                      <span>Próximo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Página {pagination.currentPage}
                      {pagination.totalPages > 1 && ` de ${pagination.totalPages}`}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 p-10">Nenhum livro encontrado com os termos da sua busca.</div>
          )}
        </div>
      </div>
  );
}

export default function CatalogoPage() {
  return (
    <QueryProvider>
      <CatalogoContent />
    </QueryProvider>
  );
}