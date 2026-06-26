// Arquivo: frontend/src/components/catalogo/CategorySummaryCarousel.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, LibraryBig } from 'lucide-react';
import { motion } from 'framer-motion';

export interface CategorySummary {
  id: number;
  name: string;
  count: number; // número de livros na categoria
}

interface CategorySummaryCarouselProps {
  categories: CategorySummary[];
}

const CategorySummaryCarousel: React.FC<CategorySummaryCarouselProps> = ({ categories }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    skipSnaps: false,
    dragFree: true,
  });

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(() => {
    emblaApi && emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi && emblaApi.scrollNext();
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

  if (categories.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="mb-16"
    >
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl">
            <LibraryBig className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Categories Overview
          </h2>
        </div>
        <div className="flex gap-4 items-center">
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
          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex-[0_0_200px] sm:flex-[0_0_240px]"
            >
              <div className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full flex flex-col border border-gray-100 dark:border-gray-700">
                {/* Badge similar to TopReads */}
                <div className={`absolute top-0 left-0 z-20 bg-blue-600 text-white font-bold px-4 py-1.5 rounded-br-2xl text-sm flex items-center gap-1 shadow-md`}>#{index + 1}</div>
                {/* Large number background */}
                <div className="absolute top-8 left-4 text-[120px] font-black text-white/90 dark:text-white/10 drop-shadow-lg z-10 select-none pointer-events-none leading-none tracking-tighter mix-blend-overlay">
                  {cat.count}
                </div>
                {/* Icon area */}
                <div className="relative flex-1 flex items-center justify-center p-4">
                  <LibraryBig className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
                </div>
                {/* Info */}
                <div className="p-5 flex flex-col flex-grow bg-white dark:bg-gray-800 relative z-30">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {cat.count} livro(s) disponível(eis)
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CategorySummaryCarousel;
