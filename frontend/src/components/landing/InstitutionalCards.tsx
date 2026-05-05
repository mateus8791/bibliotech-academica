'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const cards = [
  {
    id: 'ensino-superior',
    icon: '/icons/university.png',
    title: 'Ensino Superior',
    subtitle: 'PARA INSTITUIÇÕES DE',
    description: 'Enriqueça a bibliografia da sua instituição e ofereça aos seus alunos um acervo virtual de qualidade alinhado às normas do MEC.',
    color: 'from-blue-500 to-blue-600',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'ensino-tecnico',
    icon: '/icons/book.png',
    title: 'Ensino Técnico',
    subtitle: 'PARA INSTITUIÇÕES DE',
    description: 'Fortaleça a formação dos seus alunos com um acervo digital prático e especializado, projetado para apoiar o desenvolvimento profissional.',
    color: 'from-cyan-500 to-cyan-600',
    textColor: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    id: 'corporativo',
    icon: '/icons/business.png',
    title: 'Corporativo',
    subtitle: 'PARA EMPRESAS',
    description: 'Desenvolva as habilidades da sua equipe, promovendo gestão do conhecimento, inovação e alta performance profissional.',
    color: 'from-yellow-500 to-yellow-600',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
];

export function InstitutionalCards() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Título da Seção */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            A melhor experiência na jornada de
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              aprendizagem e Lifelong Learning!
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            A Biblioteca Virtual foi projetada para facilitar a jornada de aprendizagem do usuário na busca
            por livros, sugestões de leitura com IA e recursos dinâmicos que aprimoram o acesso ao conhecimento
            e melhoram a experiência da rotina de estudo.
          </p>
        </motion.div>

        {/* Grid de Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 h-full flex flex-col">
                {/* Ícone Animado */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={`w-32 h-32 mx-auto mb-6 rounded-full ${card.bgColor} flex items-center justify-center p-6`}
                >
                  <Image
                    src={card.icon}
                    alt={card.title}
                    width={128}
                    height={128}
                    className="w-full h-full object-contain"
                  />
                </motion.div>

                {/* Subtítulo */}
                <p className={`text-xs font-bold uppercase tracking-wider ${card.textColor} text-center mb-2`}>
                  {card.subtitle}
                </p>

                {/* Título */}
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                  {card.title}
                </h3>

                {/* Descrição */}
                <p className="text-gray-600 text-center leading-relaxed flex-grow">
                  {card.description}
                </p>

                {/* Botão (opcional) */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`mt-6 w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r ${card.color} hover:shadow-lg transition-all duration-300`}
                >
                  Saiba Mais
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Seção de Instituições Parceiras */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            São mais de 950 Instituições que utilizam a Biblioteca Virtual
          </h3>

          {/* Logos das Instituições (Grid Responsivo) */}
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-80 hover:opacity-100 transition-all duration-500">
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative w-32 h-20"
            >
              <Image
                src="/logos/Senac_logo.svg"
                alt="SENAC"
                width={128}
                height={80}
                className="object-contain filter grayscale hover:grayscale-0 transition-all"
              />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative w-32 h-20"
            >
              <Image
                src="/logos/Ufscar-logo.png"
                alt="UFSCar"
                width={128}
                height={80}
                className="object-contain filter grayscale hover:grayscale-0 transition-all"
              />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative w-32 h-20"
            >
              <Image
                src="/logos/mackenzie.png"
                alt="Mackenzie"
                width={128}
                height={80}
                className="object-contain filter grayscale hover:grayscale-0 transition-all"
              />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative w-32 h-20"
            >
              <Image
                src="/logos/fgv.png"
                alt="FGV"
                width={128}
                height={80}
                className="object-contain filter grayscale hover:grayscale-0 transition-all"
              />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative w-32 h-20"
            >
              <Image
                src="/logos/puc.png"
                alt="PUC-SP"
                width={128}
                height={80}
                className="object-contain filter grayscale hover:grayscale-0 transition-all"
              />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative w-32 h-20"
            >
              <Image
                src="/logos/anima.png"
                alt="Ânima"
                width={128}
                height={80}
                className="object-contain filter grayscale hover:grayscale-0 transition-all"
              />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative w-32 h-20"
            >
              <Image
                src="/logos/insper.png"
                alt="Insper"
                width={128}
                height={80}
                className="object-contain filter grayscale hover:grayscale-0 transition-all"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}