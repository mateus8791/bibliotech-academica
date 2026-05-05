// Arquivo: frontend/src/components/catalogo/TopReadsCarousel.tsx
// Carrossel de livros mais lidos usando Embla Carousel

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Livro } from '@/lib/schemas';

interface TopReadsCarouselProps {
  livros: Livro[];
}

const TopReadsCarousel: React.FC<TopReadsCarouselProps> = ({ livros }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    skipSnaps: false,
    dragFree: false,
  });

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

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

  if (livros.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Mais Lidos
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Os livros mais populares da nossa biblioteca
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
            className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          <button
            onClick={scrollNext}
            disabled={nextBtnDisabled}
            className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {livros.map((livro, index) => (
            <motion.div
              key={livro.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex-[0_0_280px] sm:flex-[0_0_320px]"
            >
              <Link href={`/livro/${livro.id}`}>
                <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  {/* Badge de ranking */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg">
                      <Flame className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold text-white">
                        Top {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Capa do livro */}
                  <div className="relative aspect-[3/4] w-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {livro.capa_url && !imgErrors[livro.id] ? (
                      <Image
                        src={livro.capa_url}
                        alt={`Capa do livro ${livro.titulo}`}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 280px, 320px"
                        onError={() => setImgErrors(prev => ({ ...prev, [livro.id]: true }))}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                        <Image
                          src="/covers/placeholder-icon.png"
                          alt="Capa não disponível"
                          width={80}
                          height={80}
                          className="opacity-30"
                        />
                      </div>
                    )}
                  </div>

                  {/* Informações do livro */}
                  <div className="p-4">
                    <h3 className="font-bold text-base text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                      {livro.titulo}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {livro.autores_nomes || 'Autor desconhecido'}
                    </p>

                    {/* Estatísticas */}
                    {livro.num_emprestimos !== undefined && livro.num_emprestimos > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span>{livro.num_emprestimos} empréstimos</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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

export default TopReadsCarousel;
