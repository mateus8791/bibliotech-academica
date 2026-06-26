// Arquivo: frontend/src/components/catalogo/CategoryCarousel.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, LibraryBig } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { resolveCapaUrl } from '@/lib/resolveCapaUrl';
import { Livro } from '@/lib/schemas';

interface CategoryCarouselProps {
  categoryId: number;
  categoryName: string;
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ categoryId, categoryName }) => {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    skipSnaps: false,
    dragFree: true,
  });

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const fetchLivros = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/livros?categoria=${categoryId}&limit=8`);
        let data = [];
        if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        }
        
        const formatados = data.map((livro: any) => ({
          ...livro,
          id: String(livro.id),
          capa_url: resolveCapaUrl(livro.capa_url),
          autores_nomes: Array.isArray(livro.autores) ? livro.autores.map((a: any) => a.nome).join(', ') : livro.autores_nomes || null
        }));
        setLivros(formatados);
      } catch (error) {
        console.error(`Erro ao buscar livros da categoria ${categoryName}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchLivros();
  }, [categoryId, categoryName]);

  if (loading) {
    return (
      <div className="mb-12 animate-pulse px-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 w-48 rounded mb-6"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="min-w-[240px] h-[340px] bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (livros.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="mb-16"
    >
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl">
            <LibraryBig className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {categoryName}
          </h2>
        </div>

        <div className="flex gap-4 items-center">
          <Link href={`#`} className="hidden sm:block text-blue-600 font-medium hover:underline mr-2 flex items-center gap-1">
            Ver todos <span className="text-xl leading-none">›</span>
          </Link>
          <button
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
            className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          <button
            onClick={scrollNext}
            disabled={nextBtnDisabled}
            className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden px-2 pb-8 pt-2" ref={emblaRef}>
        <div className="flex gap-6">
          {livros.map((livro, index) => (
            <motion.div
              key={livro.id}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex-[0_0_200px] sm:flex-[0_0_240px]"
            >
              <Link href={`/livro/${livro.id}`}>
                {/* Visual Estilo 'Mais Lidos' (Premium) */}
                <div className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full flex flex-col border border-gray-100 dark:border-gray-700">
                  
                  {/* Badge (Estilo TopReads) */}
                  <div className={`absolute top-0 left-0 z-20 bg-blue-600 text-white font-bold px-4 py-1.5 rounded-br-2xl text-sm flex items-center gap-1 shadow-md`}>
                    #{index + 1}
                  </div>

                  {/* Número GIGANTE atrás da capa */}
                  <div className="absolute top-8 left-4 text-[120px] font-black text-white/90 dark:text-white/10 drop-shadow-lg z-10 select-none pointer-events-none leading-none tracking-tighter mix-blend-overlay">
                    {index + 1}
                  </div>

                  {/* Capa */}
                  <div className="relative aspect-square w-full bg-gradient-to-br from-indigo-900 to-blue-950 overflow-hidden pt-12 pb-4 px-4 flex justify-end items-end">
                    {livro.capa_url && !imgErrors[livro.id] ? (
                      <div className="relative w-[120px] h-[160px] z-20 shadow-2xl rounded-md overflow-hidden rotate-[-2deg] group-hover:rotate-0 transition-all duration-300 group-hover:scale-110 origin-bottom-right">
                        <Image
                          src={livro.capa_url}
                          alt={`Capa do livro ${livro.titulo}`}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="120px"
                          onError={() => setImgErrors(prev => ({ ...prev, [livro.id]: true }))}
                        />
                      </div>
                    ) : (
                      <div className="w-[120px] h-[160px] bg-white/10 rounded-md z-20"></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col flex-grow bg-white dark:bg-gray-800 relative z-30">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                      {livro.titulo}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-3">
                      {livro.autores_nomes || 'Autor desconhecido'}
                    </p>

                    {/* Exibe Disponibilidade / Estatísticas como no TopReads */}
                    <div className="mt-auto">
                      {(livro as any).quantidade_disponivel && (livro as any).quantidade_disponivel > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full w-max">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          Disponível
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full w-max">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          Emprestado
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryCarousel;
