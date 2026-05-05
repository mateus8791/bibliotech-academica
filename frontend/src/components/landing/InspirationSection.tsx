'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ReadingPersonIllustration, BooksStackIllustration, LightBulbIllustration } from './DecorativeIllustrations';
import { BookOpen, Award, Users, TrendingUp } from 'lucide-react';

export default function InspirationSection() {
  const benefits = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Acervo Completo',
      description: 'Milhares de livros acadêmicos e técnicos disponíveis para empréstimo e compra',
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Qualidade Garantida',
      description: 'Conteúdo curado por especialistas para sua formação acadêmica',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Comunidade Ativa',
      description: 'Conecte-se com outros estudantes e compartilhe conhecimento',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Evolução Constante',
      description: 'Novos títulos adicionados regularmente ao catálogo',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-20 -translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative">
              <ReadingPersonIllustration className="w-full h-auto drop-shadow-2xl" />

              {/* Floating elements */}
              <motion.div
                className="absolute -top-8 -right-8"
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <LightBulbIllustration className="w-24 h-24 drop-shadow-lg" />
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4"
                animate={{
                  y: [0, 15, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
              >
                <BooksStackIllustration className="w-32 h-32 drop-shadow-lg" />
              </motion.div>
            </div>
          </motion.div>

          {/* Right side - Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Transforme seu{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Aprendizado
              </span>
            </h2>

            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Nossa biblioteca acadêmica oferece mais do que livros. Oferecemos uma experiência completa de aprendizado,
              com recursos modernos e um acervo constantemente atualizado para apoiar sua jornada educacional.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className="text-blue-600 mb-3">{benefit.icon}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <a
                href="#daily-deals"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Explorar Biblioteca
                <BookOpen className="w-5 h-5" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
