// Arquivo: frontend/src/components/catalogo/DescubraLivros.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { resolveCapaUrl } from '@/lib/resolveCapaUrl';
import { Livro } from '@/lib/schemas';

const DescubraLivros: React.FC = () => {
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

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

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
        // Busca livros mais recentes ou aleatórios
        const response = await api.get('/livros?limit=12&orderBy=recentes');
        let data: any[] = [];
        if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        }

        const formatados: Livro[] = data.map((livro: any) => ({
          ...livro,
          id: String(livro.id),
          capa_url: resolveCapaUrl(livro.capa_url),
          autores_nomes: Array.isArray(livro.autores) ? livro.autores.map((a: any) => a.nome).join(', ') : livro.autores_nomes || null,
        }));
        setLivros(formatados);
      } catch (error) {
        console.error('Erro ao buscar livros para Descubra:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLivros();
  }, []);

  if (loading) {
    return (
      <div className="mb-16 animate-pulse px-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 w-48 rounded mb-6"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="min-w-[180px] h-[300px] bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
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
          <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl">
            <Compass className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Descubra livros
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Sugestões inteligentes baseadas nas suas leituras
            </p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="#" className="hidden sm:block text-blue-600 font-medium hover:underline mr-2">
            Ver todos <span className="text-xl leading-none">›</span>
          </Link>
          <button onClick={scrollPrev} disabled={prevBtnDisabled} className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          <button onClick={scrollNext} disabled={nextBtnDisabled} className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden px-2 pb-8 pt-2" ref={emblaRef}>
        <div className="flex gap-5">
          {livros.map((livro) => (
            <motion.div
              key={livro.id}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex-[0_0_160px] sm:flex-[0_0_190px]"
            >
              <Link href={`/livro/${livro.id}`}>
                <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
                  
                  {/* Capa */}
                  <div className="relative w-full aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                    {livro.capa_url && !imgErrors[livro.id] ? (
                      <Image
                        src={livro.capa_url}
                        alt={livro.titulo}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="190px"
                        onError={() => setImgErrors(prev => ({ ...prev, [livro.id]: true }))}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Compass className="w-12 h-12 opacity-30" />
                      </div>
                    )}
                    {/* Overlay sutil no hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {/* Bookmark */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-1.5 rounded-full bg-white/90 shadow-md">
                        <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3.5">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {livro.titulo}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {livro.autores_nomes || 'Autor'}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {Number((livro as any).total_avaliacoes) > 0 ? (
                        <>
                          <svg className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {Number((livro as any).nota_media).toFixed(1)}
                          </span>
                          <span className="text-[11px] text-gray-400">({Number((livro as any).total_avaliacoes)})</span>
                        </>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Novo</span>
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

export default DescubraLivros;
