'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import Image from 'next/image';

interface Testimonial {
  id: number;
  institution: string;
  logo: string;
  type: string;
  author: string;
  role: string;
  text: string;
  rating: number;
  city: string;
  photo?: string;
  backgroundPhoto?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    institution: 'Universidade Federal de São Paulo',
    logo: 'UNIFESP',
    type: 'Ensino Superior',
    author: 'Prof. Dr. Carlos Eduardo Silva',
    role: 'Coordenador de Biblioteca',
    text: 'A Biblioteca Virtual transformou completamente a experiência de pesquisa dos nossos alunos. O acesso ilimitado a milhares de títulos acadêmicos e a interface intuitiva aumentaram significativamente o engajamento com a leitura.',
    rating: 5,
    city: 'São Paulo - SP',
    photo: '/testimonials/carlos-unifesp.png',
    backgroundPhoto: '/testimonials/unifesp-campus.png'
  },
  {
    id: 2,
    institution: 'SENAI São Paulo',
    logo: 'SENAI',
    type: 'Ensino Técnico',
    author: 'Ana Paula Rodrigues',
    role: 'Diretora Pedagógica',
    text: 'O sistema de analytics nos permitiu identificar quais áreas técnicas precisam de mais material de apoio. A multiplataforma é essencial para nossos alunos que estudam e trabalham.',
    rating: 5,
    city: 'São Paulo - SP',
    photo: '/testimonials/ana-paula-senai.jpg',
    backgroundPhoto: '/testimonials/senai-escola.jpg'
  },
  {
    id: 3,
    institution: 'Faculdade de Tecnologia do Estado',
    logo: 'FATEC',
    type: 'Ensino Superior',
    author: 'Roberto Fernandes',
    role: 'Bibliotecário Chefe',
    text: 'A integração com nosso sistema acadêmico foi perfeita. Os relatórios de empréstimos e a gestão de multas automatizada economizaram horas de trabalho manual da nossa equipe.',
    rating: 5,
    city: 'Campinas - SP',
    photo: '/testimonials/roberto-fatec.png',
    backgroundPhoto: '/testimonials/fatec-campus.jpeg'
  },
  {
    id: 4,
    institution: 'Instituto Federal do Rio de Janeiro',
    logo: 'IFRJ',
    type: 'Ensino Técnico',
    author: 'Juliana Moreira Costa',
    role: 'Coordenadora de TI Educacional',
    text: 'A busca inteligente e os filtros avançados facilitaram muito a vida dos nossos estudantes. O suporte técnico é excepcional e sempre nos atende prontamente.',
    rating: 5,
    city: 'Rio de Janeiro - RJ',
    photo: '/testimonials/juliana-ifrj.png',
    backgroundPhoto: '/testimonials/ifrj-campus.jpg'
  },
  {
    id: 5,
    institution: 'Grupo Educacional Abril',
    logo: 'Abril Educação',
    type: 'Corporativo',
    author: 'Marcelo Alves',
    role: 'Gerente de Recursos Humanos',
    text: 'Implementamos a plataforma para capacitação dos nossos colaboradores. O sistema de recomendações personalizadas ajuda cada funcionário a encontrar o conteúdo ideal para seu desenvolvimento profissional.',
    rating: 5,
    city: 'São Paulo - SP',
    photo: '/testimonials/marcelo-abril.png',
    backgroundPhoto: '/testimonials/abril-escritorio.jpeg'
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Autoplay
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Título */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#003366] mb-4">
            O que dizem nossos parceiros
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Mais de <span className="text-[#006BA6] font-semibold">560 instituições</span> confiam
            na nossa plataforma para transformar a experiência de leitura
          </p>
        </div>

        {/* Carrossel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* Coluna da Esquerda - Info da Instituição */}
                <div className="bg-[#003366] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
                  {/* Foto de Fundo da Instituição (se houver) */}
                  {currentTestimonial.backgroundPhoto && (
                    <div className="absolute inset-0 opacity-15">
                      <Image
                        src={currentTestimonial.backgroundPhoto}
                        alt={currentTestimonial.institution}
                        fill
                        quality={100}
                        className="object-cover object-center"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Conteúdo - camada acima da foto */}
                  <div className="relative z-10">
                    {/* Logo Placeholder */}
                    <div className="mb-6">
                      <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                        <span className="text-3xl font-bold text-cyan-400">
                          {currentTestimonial.logo.charAt(0)}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">
                        {currentTestimonial.institution}
                      </h3>
                      <div className="inline-block px-3 py-1 bg-cyan-500/20 rounded-full backdrop-blur-sm">
                        <span className="text-cyan-300 text-sm font-semibold">
                          {currentTestimonial.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Autor - na parte inferior */}
                  <div className="relative z-10 mt-auto">
                    {/* Foto do autor em círculo (se houver) */}
                    {currentTestimonial.photo && (
                      <div className="mb-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl">
                          <Image
                            src={currentTestimonial.photo}
                            alt={currentTestimonial.author}
                            width={256}
                            height={256}
                            quality={100}
                            priority
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                    <p className="font-semibold text-lg">{currentTestimonial.author}</p>
                    <p className="text-cyan-300 text-sm mb-2">{currentTestimonial.role}</p>
                    <p className="text-white/60 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {currentTestimonial.city}
                    </p>
                  </div>
                </div>

                {/* Coluna da Direita - Depoimento */}
                <div className="lg:col-span-2 p-8 lg:p-12 flex flex-col justify-center">
                  {/* Ícone de Quote */}
                  <Quote className="w-12 h-12 text-cyan-400 mb-6" />

                  {/* Texto do Depoimento */}
                  <blockquote className="text-gray-700 text-lg leading-relaxed mb-8">
                    "{currentTestimonial.text}"
                  </blockquote>

                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-4">
                    {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  {/* Estatística */}
                  <div className="flex items-center space-x-8 text-sm text-gray-500">
                    <div>
                      <span className="font-semibold text-[#006BA6] text-2xl">98%</span>
                      <p>Satisfação</p>
                    </div>
                    <div>
                      <span className="font-semibold text-[#006BA6] text-2xl">+3 anos</span>
                      <p>Parceria</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controles de Navegação */}
          <div className="flex items-center justify-center mt-8 space-x-4">
            {/* Botão Anterior */}
            <button
              onClick={goToPrev}
              className="p-3 rounded-full bg-white border-2 border-gray-200 text-gray-700 hover:border-[#006BA6] hover:text-[#006BA6] transition-all shadow-md hover:shadow-lg"
              aria-label="Depoimento anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Indicadores */}
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-[#006BA6]'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir para depoimento ${index + 1}`}
                />
              ))}
            </div>

            {/* Botão Próximo */}
            <button
              onClick={goToNext}
              className="p-3 rounded-full bg-white border-2 border-gray-200 text-gray-700 hover:border-[#006BA6] hover:text-[#006BA6] transition-all shadow-md hover:shadow-lg"
              aria-label="Próximo depoimento"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Junte-se a centenas de instituições que já transformaram sua biblioteca
          </p>
          <button className="bg-[#006BA6] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#005A8C] transition-colors shadow-lg">
            Fale com Nosso Time
          </button>
        </div>
      </div>
    </section>
  );
}
