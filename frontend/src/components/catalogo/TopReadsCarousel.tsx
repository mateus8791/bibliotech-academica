// Arquivo: frontend/src/components/catalogo/TopReadsCarousel.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Livro } from '@/lib/schemas';

interface TopReadsCarouselProps {
  livros: Livro[];
}

// Cores dos badges (Top 1 é Laranja, Top 2 Azul Claro, Top 3 Roxo, Top 4 Teal, Top 5 Azul Escuro...)
const getBadgeColor = (index: number) => {
  const colors = [
    'bg-amber-500', // Top 1
    'bg-cyan-500',  // Top 2
    'bg-purple-600', // Top 3
    'bg-teal-500',   // Top 4
    'bg-blue-600',   // Top 5
  ];
  return colors[index] || 'bg-gray-600';
};

const TopReadsCarousel: React.FC<TopReadsCarouselProps> = ({ livros }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    skipSnaps: false,
    dragFree: true,
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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="mb-16"
    >
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl">
            <Crown className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mais Lidos
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Os livros mais populares da nossa biblioteca
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <Link href="#" className="hidden sm:block text-blue-600 font-medium hover:underline mr-2 flex items-center gap-1">
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
                <div className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full flex flex-col border border-gray-100 dark:border-gray-700">
                  
                  {/* Badge de Ranking (Mockup Design) */}
                  <div className={`absolute top-0 left-0 z-20 ${getBadgeColor(index)} text-white font-bold px-4 py-1.5 rounded-br-2xl text-sm flex items-center gap-1 shadow-md`}>
                    <Crown className="w-3 h-3" /> Top {index + 1}
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

                    {/* Estatísticas */}
                    {livro.num_emprestimos !== undefined && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-500 px-2.5 py-1 rounded-full w-max">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                        {livro.num_emprestimos} empréstimos
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
