// Arquivo: frontend/src/app/catalogo/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, LoaderCircle, PlusCircle, ChevronLeft, ChevronRight, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import api from '@/services/api';
import BookCard from '@/components/BookCard';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import TopReadsCarousel from '@/components/catalogo/TopReadsCarousel';
import HeroBanners from '@/components/catalogo/HeroBanners';
import ParaVoceGrid from '@/components/catalogo/ParaVoceGrid';
import CategorySummaryCarousel from '@/components/catalogo/CategorySummaryCarousel';
import SmallBannerSection from '@/components/catalogo/SmallBannerSection';
import DescubraLivros from '@/components/catalogo/DescubraLivros';
import DescubraCategorias from '@/components/catalogo/DescubraCategorias';
import RankingChart from '@/components/catalogo/RankingChart';
import BannersMosaico from '@/components/catalogo/BannersMosaico';
import AutoresEmDestaque from '@/components/catalogo/AutoresEmDestaque';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { mockCategories, mockTopReads } from '@/lib/mock-data';
import type { Livro as LivroCarousel } from '@/lib/schemas';
import { resolveCapaUrl } from '@/lib/resolveCapaUrl';

interface Autor {
  id: number;
  nome: string;
}

interface Livro {
  id: string;
  titulo: string;
  capa_url: string | null;
  autores?: Autor[] | string | null;
  autores_nomes?: string | null;
  nota_media?: number | string | null;
  total_avaliacoes?: number | string | null;
  quantidade_disponivel?: number | null;
  categorias?: Array<{ id?: string | number; nome: string }> | string | null;
}

interface Category {
  category_id: number;
  name: string;
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
  const [livrosGrid, setLivrosGrid] = useState<Livro[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topReads, setTopReads] = useState<LivroCarousel[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [carregandoGrid, setCarregandoGrid] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20, hasNextPage: false, hasPreviousPage: false
  });

  // Grade "Todo o acervo" (aparece na landing, sem busca ativa)
  const [acervo, setAcervo] = useState<Livro[]>([]);
  const [acervoLoading, setAcervoLoading] = useState(false);
  const [acervoPage, setAcervoPage] = useState(1);
  const [acervoPagination, setAcervoPagination] = useState<PaginationData>({
    currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10, hasNextPage: false, hasPreviousPage: false
  });

  const termoBuscaDebounced = useDebounce(termoBusca, 500);
  const isBuscando = termoBuscaDebounced !== '' || selectedCategory !== null || selectedAuthor !== null;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categorias/publico');
        if (Array.isArray(response.data)) {
          setCategories(response.data);
        }
      } catch (error) {
        setCategories(mockCategories);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchTopReads = async () => {
      try {
        const response = await api.get('/livros?limit=12&orderBy=emprestimos');
        const mapLivro = (livro: any): LivroCarousel => ({
          id: String(livro.id),
          titulo: livro.titulo,
          capa_url: resolveCapaUrl(livro.capa_url),
          autores_nomes: Array.isArray(livro.autores) ? livro.autores.map((a: Autor) => a.nome).join(', ') : (livro.autores_nomes ?? null),
          num_emprestimos: livro.num_emprestimos ?? 0,
        });

        if (Array.isArray(response.data)) {
          setTopReads(response.data.slice(0, 10).map(mapLivro));
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setTopReads(response.data.data.slice(0, 10).map(mapLivro));
        }
      } catch (error) {
        setTopReads(mockTopReads);
      }
    };
    fetchTopReads();
  }, []);

  const buscarLivros = useCallback(async (pageToFetch: number) => {
    if (!isBuscando) return; // Só busca se houver algum filtro ativo

    try {
      setCarregandoGrid(true);
      const params = new URLSearchParams();
      if (termoBuscaDebounced) params.append('search', termoBuscaDebounced);
      if (selectedCategory) params.append('categoria', selectedCategory.toString());
      if (selectedAuthor) params.append('autor', selectedAuthor);
      params.append('page', pageToFetch.toString());
      params.append('limit', '20');

      const response = await api.get(`/livros?${params.toString()}`);

      const processLivros = (dados: any[]) => dados.map((livro: any) => ({
        ...livro,
        id: String(livro.id),
        capa_url: resolveCapaUrl(livro.capa_url),
        autores_nomes: Array.isArray(livro.autores) ? livro.autores.map((a: Autor) => a.nome).join(', ') : livro.autores_nomes || null
      }));

      if (response.data.data && Array.isArray(response.data.data)) {
        setLivrosGrid(processLivros(response.data.data));
        setPagination(response.data.pagination);
      } else if (Array.isArray(response.data)) {
        const processados = processLivros(response.data);
        const itemsPerPage = 20;
        const totalPages = Math.ceil(processados.length / itemsPerPage);
        const startIndex = (pageToFetch - 1) * itemsPerPage;
        
        setLivrosGrid(processados.slice(startIndex, startIndex + itemsPerPage));
        setPagination({
          currentPage: pageToFetch, totalPages, totalItems: processados.length, itemsPerPage,
          hasNextPage: pageToFetch < totalPages, hasPreviousPage: pageToFetch > 1
        });
      }
      setErro(null);
    } catch (error) {
      setErro("Não foi possível carregar os resultados.");
    } finally {
      setCarregandoGrid(false);
    }
  }, [termoBuscaDebounced, selectedCategory, selectedAuthor, isBuscando]);

  useEffect(() => {
    if (isBuscando) {
      buscarLivros(pagination.currentPage);
    }
  }, [pagination.currentPage, termoBuscaDebounced, selectedCategory, selectedAuthor, isBuscando]);

  // Busca a grade "Todo o acervo" — só roda na landing (sem busca/filtro ativo)
  useEffect(() => {
    if (isBuscando) return;

    const fetchAcervo = async () => {
      try {
        setAcervoLoading(true);
        const response = await api.get(`/livros?page=${acervoPage}&limit=10`);

        const processLivros = (dados: any[]) => dados.map((livro: any) => ({
          ...livro,
          id: String(livro.id),
          capa_url: resolveCapaUrl(livro.capa_url),
          autores_nomes: Array.isArray(livro.autores) ? livro.autores.map((a: Autor) => a.nome).join(', ') : livro.autores_nomes || null
        }));

        if (response.data.data && Array.isArray(response.data.data)) {
          setAcervo(processLivros(response.data.data));
          setAcervoPagination(response.data.pagination);
        } else if (Array.isArray(response.data)) {
          setAcervo(processLivros(response.data));
        }
      } catch (error) {
        console.error('Erro ao carregar o acervo:', error);
      } finally {
        setAcervoLoading(false);
      }
    };

    fetchAcervo();
  }, [acervoPage, isBuscando]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAcervoPageChange = (newPage: number) => {
    setAcervoPage(newPage);
  };

  const handleDeleteLivro = (id: string) => {
    setLivrosGrid(atuais => atuais.filter(l => l.id !== id));
  };

  return (
    <div className="min-h-screen bg-indigo-50/30 dark:bg-gray-950 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Cabeçalho do Catálogo / Busca */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div className="w-full relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors z-10" />
            <input
              type="text"
              placeholder="Buscar por título, autor, categoria..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border-2 border-transparent focus:border-blue-600 rounded-full shadow-sm focus:shadow-md focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-xs text-gray-400 font-medium">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">K</kbd>
            </div>
          </div>
          
          {usuario?.tipo_usuario === 'bibliotecario' && (
            <Link href="/dashboard/livros/novo" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-md hover:shadow-lg transition-all shrink-0">
              <PlusCircle size={18} /> <span className="hidden sm:inline">Adicionar Livro</span>
            </Link>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!isBuscando ? (
            /* --- LANDING PAGE MODE (ESTILO BIBLIOTECH) --- */
            <motion.div
              key="landing-page"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-2"
            >
              {/* HERO BANNER */}
              <HeroBanners />

              {/* PARA VOCÊ (GRID ASSIMÉTRICO) */}
              {usuario && <ParaVoceGrid />}

              {/* MAIS LIDOS (TOP 1, TOP 2...) */}
              {topReads.length > 0 && <TopReadsCarousel livros={topReads} />}

              {/* PEQUENOS BANNERS (INÍCIO) */}
              <SmallBannerSection />

              {/* CARROSSEL DE RESUMO DE CATEGORIAS (COM CONTAGEM) */}
              <CategorySummaryCarousel categories={categories.map(cat => ({
                id: cat.category_id,
                name: cat.name,
                // Supondo que a API retorne a quantidade em `livros_count`
                count: (cat as any).livros_count ?? 0,
              }))} />

              {/* MAIS UM BANNER TIPO HERO ROTATIVO EM MEIO (PREFERÊNCIAS) */}
              {usuario ? <HeroBanners tipo="recomendacoes" /> : <HeroBanners />}

              {/* PEQUENOS BANNERS (MEIO) */}
              {usuario ? <SmallBannerSection tipo="recomendacoes" /> : <SmallBannerSection />}

              {/* DESCUBRA LIVROS */}
              <DescubraLivros />

              {/* PEQUENOS BANNERS (FINAL) */}
              <SmallBannerSection />

              {/* RANKING DE LEITORES ANIMADO COM FOTINHAS */}
              {usuario && <RankingChart />}

              {/* AUTORES EM DESTAQUE */}
              <AutoresEmDestaque />

              {/* MOSAICO DE BANNERS (DESTAQUES) */}
              <BannersMosaico />

              {/* MAIS CATEGORIAS REMOVIDAS - já exibidas no CategorySummaryCarousel */}

              {/* TODO O ACERVO (GRADE PAGINADA) */}
              <div className="mt-16">
                <div className="flex items-center gap-3 mb-8 px-2">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-xl">
                    <Library className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Todo o acervo</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      Explore todos os livros da biblioteca
                    </p>
                  </div>
                </div>

                {acervoLoading && acervo.length === 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="aspect-[2/3] rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    ))}
                  </div>
                ) : acervo.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {acervo.map((livro) => (
                        <BookCard
                          key={livro.id}
                          livro={{ ...livro, autores: livro.autores_nomes || null }}
                          onDelete={(id) => setAcervo((atuais) => atuais.filter((l) => l.id !== id))}
                        />
                      ))}
                    </div>

                    {acervoPagination.totalPages > 1 && (
                      <div className="mt-10 flex justify-center items-center gap-4">
                        <button
                          onClick={() => handleAcervoPageChange(acervoPagination.currentPage - 1)}
                          disabled={!acervoPagination.hasPreviousPage}
                          className="p-3 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all"
                        >
                          <ChevronLeft />
                        </button>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Página {acervoPagination.currentPage} de {acervoPagination.totalPages}
                        </span>
                        <button
                          onClick={() => handleAcervoPageChange(acervoPagination.currentPage + 1)}
                          disabled={!acervoPagination.hasNextPage}
                          className="p-3 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all"
                        >
                          <ChevronRight />
                        </button>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* DESCUBRA CATEGORIAS (LÁÁÁ EMBAIXO, COM ÍCONES ANIMADOS) */}
              {categories.length > 0 && (
                <DescubraCategorias
                  categories={categories}
                  onSelectCategory={(id) => {
                    setSelectedCategory(id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}
            </motion.div>
          ) : (
            /* --- SEARCH RESULTS MODE (GRID) --- */
            <motion.div
              key="search-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800"
            >
              <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Library className="text-blue-600" />
                  {selectedCategory 
                    ? `Livros da categoria: ${categories.find(c => c.category_id === selectedCategory)?.name || ''}`
                    : 'Resultados da Busca'}
                </h2>
                <button 
                  onClick={() => { setTermoBusca(''); setSelectedCategory(null); setSelectedAuthor(null); }}
                  className="text-sm font-medium px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-red-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-red-400 rounded-full transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>

              {carregandoGrid ? (
                <div className="flex flex-col items-center justify-center py-20 text-blue-600">
                  <LoaderCircle className="w-12 h-12 animate-spin mb-4" />
                  <p className="text-gray-500 font-medium">Buscando no acervo...</p>
                </div>
              ) : erro ? (
                <div className="text-center py-20 bg-red-50 text-red-600 rounded-2xl">{erro}</div>
              ) : livrosGrid.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {livrosGrid.map(livro => (
                      <motion.div 
                        key={livro.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <BookCard livro={{...livro, autores: livro.autores_nomes || null}} onDelete={handleDeleteLivro} />
                      </motion.div>
                    ))}
                  </div>

                  {/* PAGINAÇÃO */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-12 flex justify-center items-center gap-4">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPreviousPage}
                        className="p-3 rounded-full bg-white border shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-all"
                      >
                        <ChevronLeft />
                      </button>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Página {pagination.currentPage} de {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="p-3 rounded-full bg-white border shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-all"
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <Image src="/covers/placeholder-icon.png" alt="Não encontrado" width={100} height={100} className="mx-auto mb-4 opacity-20 grayscale" />
                  <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Nenhum livro encontrado</h3>
                  <p className="text-gray-500">Tente ajustar seus termos de busca ou filtros.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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