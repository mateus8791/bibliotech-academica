// Arquivo: frontend/src/components/catalogo/DescubraCategorias.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  BookOpen, Heart, Drama, FlaskConical, Monitor, Landmark, User, 
  Sparkles, GraduationCap, Palette, Globe, Music, Dumbbell, Baby,
  Lightbulb, Leaf, Scale, Telescope, Sword
} from 'lucide-react';

interface Category {
  category_id: number;
  name: string;
}

interface DescubraCategoriasProps {
  categories: Category[];
  onSelectCategory: (id: number) => void;
}

const getIconForCategory = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('ficção') || n.includes('literatura')) return BookOpen;
  if (n.includes('romance')) return Heart;
  if (n.includes('suspense') || n.includes('terror') || n.includes('drama')) return Drama;
  if (n.includes('ciência') || n.includes('exatas')) return FlaskConical;
  if (n.includes('tecnologia') || n.includes('informática')) return Monitor;
  if (n.includes('história') || n.includes('humanas')) return Landmark;
  if (n.includes('biografia') || n.includes('autobiografia')) return User;
  if (n.includes('autoajuda') || n.includes('desenvolvimento')) return Lightbulb;
  if (n.includes('aventura')) return Sword;
  if (n.includes('infantil') || n.includes('juvenil')) return Baby;
  if (n.includes('arte') || n.includes('design')) return Palette;
  if (n.includes('idioma') || n.includes('língua')) return Globe;
  if (n.includes('música')) return Music;
  if (n.includes('esporte') || n.includes('saúde')) return Dumbbell;
  if (n.includes('educação') || n.includes('didático') || n.includes('pedagog')) return GraduationCap;
  if (n.includes('natureza') || n.includes('ecologia')) return Leaf;
  if (n.includes('direito') || n.includes('lei')) return Scale;
  if (n.includes('astronomia') || n.includes('física')) return Telescope;
  if (n.includes('clássic') || n.includes('contos')) return BookOpen;
  return Sparkles;
};

const getBgGradient = (index: number) => {
  const gradients = [
    'from-blue-600 to-indigo-700',
    'from-purple-600 to-fuchsia-700',
    'from-emerald-600 to-teal-700',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-700',
    'from-cyan-600 to-blue-700',
    'from-violet-600 to-indigo-700',
    'from-lime-600 to-green-700',
    'from-red-500 to-rose-700',
    'from-sky-500 to-cyan-700',
  ];
  return gradients[index % gradients.length];
};

// Container & item variants for stagger animation
const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 }
  }
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  }
};

export default function DescubraCategorias({ categories, onSelectCategory }: DescubraCategoriasProps) {
  // Filtra a categoria "teste" e limita a 15 itens para garantir um grid bem alinhado (3 linhas de 5)
  const categoriasExibidas = categories
    .filter(cat => cat.name.trim().toLowerCase() !== 'teste')
    .slice(0, 15);

  if (categoriasExibidas.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="mb-20"
    >
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="p-2.5 bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/30 dark:to-fuchsia-900/30 rounded-xl">
          <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Descubra categorias</h2>
          <p className="text-gray-500 dark:text-gray-400">Explore o acervo por temas que combinam com você</p>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-30px" }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 px-2"
      >
        {categoriasExibidas.map((cat, index) => {
          const Icon = getIconForCategory(cat.name);
          
          // Mapeia o nome da categoria para a imagem de fundo correspondente, se houver
          const bgImageName = cat.name.toLowerCase().includes('fantasia') ? 'fantasia.png'
                            : cat.name.toLowerCase().includes('ficção') ? 'ficcao.png'
                            : cat.name.toLowerCase().includes('aventura') ? 'aventura.png'
                            : cat.name.toLowerCase().includes('biografia') ? 'biografia.png'
                            : null;

          return (
            <motion.button
              key={cat.category_id}
              variants={item}
              whileHover={{ 
                scale: 1.08, 
                y: -6,
                transition: { type: "spring", stiffness: 400, damping: 15 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCategory(cat.category_id)}
              className={`group relative flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br ${getBgGradient(index)} text-white shadow-md hover:shadow-2xl transition-shadow duration-300 overflow-hidden min-h-[140px]`}
            >
              {/* Fundo com Imagem IA (se existir) */}
              {bgImageName && (
                <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay group-hover:opacity-60 transition-opacity duration-500">
                  <Image 
                    src={`/banners/categorias/${bgImageName}`} 
                    alt={`Fundo ${cat.name}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              {/* Glow de fundo animado */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 rounded-3xl z-0"></div>
              {/* Círculo decorativo */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/5 rounded-full group-hover:scale-125 transition-transform duration-700 z-0"></div>

              {/* Ícone com animação de bounce */}
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
                className="relative z-10 mb-3"
              >
                <Icon className="w-10 h-10 drop-shadow-md" strokeWidth={1.8} />
              </motion.div>

              <span className="relative z-10 text-sm font-bold text-center leading-tight drop-shadow-sm">{cat.name}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
