'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Layout,
  BookOpen,
  BarChart3,
  Search,
  Heart,
  Smartphone,
  Brain
} from 'lucide-react';
import Image from 'next/image';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface ResourceContent {
  title: string;
  description: string;
  features: string[];
  imagePlaceholder: string;
}

const tabs: Tab[] = [
  {
    id: 'search',
    label: 'Busca Inteligente',
    icon: <Search className="w-5 h-5" />
  },
  {
    id: 'personalization',
    label: 'Personalização',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: 'multiplatform',
    label: 'Multiplataforma',
    icon: <Smartphone className="w-5 h-5" />
  },
  {
    id: 'analytics',
    label: 'Analytics Acadêmico',
    icon: <BarChart3 className="w-5 h-5" />
  },
];

const resourcesContent: Record<string, ResourceContent> = {
  search: {
    title: 'Busca Inteligente com Filtros Avançados',
    description: 'Encontre exatamente o que você precisa com nossa busca avançada que utiliza filtros por autor, categoria, editora e ano de publicação.',
    features: [
      'Busca por título, autor ou ISBN',
      'Filtros dinâmicos por categoria e editora',
      'Sugestões de leitura baseadas em histórico',
      'Resultados instantâneos com debounce',
    ],
    imagePlaceholder: 'Sistema de busca com filtros laterais'
  },
  personalization: {
    title: 'Experiência Personalizada para Cada Leitor',
    description: 'A plataforma se adapta ao seu perfil, oferecendo recomendações personalizadas e facilitando o acesso aos seus livros favoritos.',
    features: [
      'Dashboard personalizado por perfil (Aluno/Bibliotecário)',
      'Histórico de leituras e empréstimos',
      'Sistema de favoritos e listas de leitura',
      'Notificações de prazos e novidades',
    ],
    imagePlaceholder: 'Dashboard com recomendações personalizadas'
  },
  multiplatform: {
    title: 'Acesse de Qualquer Dispositivo',
    description: 'Leia onde e quando quiser. Nossa plataforma funciona perfeitamente em desktop, tablet e smartphone, com sincronização automática.',
    features: [
      'Design responsivo para todos os dispositivos',
      'Aplicativos nativos iOS e Android',
      'Sincronização em tempo real',
      'Modo offline para leitura sem conexão',
    ],
    imagePlaceholder: 'Interface em desktop, tablet e smartphone'
  },
  analytics: {
    title: 'Dados e Insights para Gestão Eficiente',
    description: 'Ferramentas analíticas avançadas para bibliotecários acompanharem métricas de uso, popularidade de livros e comportamento de leitura.',
    features: [
      'Gráficos de empréstimos por período',
      'Ranking de livros mais populares',
      'Relatórios de inadimplência e multas',
      'Análise de crescimento de acervo',
    ],
    imagePlaceholder: 'Dashboard com gráficos e métricas'
  },
};

export function ResourcesSection() {
  const [activeTab, setActiveTab] = useState('search');

  const currentContent = resourcesContent[activeTab];

  return (
    <section id="recursos" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Título da Seção */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#003366] mb-4">
            Nossos Recursos
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Uma plataforma <span className="text-cyan-500 font-semibold">inteligente</span>,
            <span className="text-[#006BA6] font-semibold"> segura</span> e
            <span className="text-cyan-500 font-semibold"> acessível</span> para todos
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all
                ${activeTab === tab.id
                  ? 'bg-[#003366] text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo das Tabs */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Coluna da Esquerda - Texto */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-[#003366]">
                {currentContent.title}
              </h3>

              <p className="text-gray-600 text-lg leading-relaxed">
                {currentContent.description}
              </p>

              <ul className="space-y-4">
                {currentContent.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-gray-700 leading-relaxed">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="pt-4">
                <button className="bg-[#006BA6] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#005A8C] transition-colors shadow-md">
                  Veja todos os Recursos
                </button>
              </div>
            </div>

            {/* Coluna da Direita - Imagem/Mockup */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="relative bg-gradient-to-br from-[#006BA6] to-[#003366] rounded-2xl shadow-2xl p-8 min-h-[400px] flex items-center justify-center"
              >
                {/* Placeholder para Screenshot/Mockup */}
                <div className="text-center space-y-4">
                  {activeTab === 'search' && <Search className="w-24 h-24 text-cyan-400 mx-auto" />}
                  {activeTab === 'personalization' && <Heart className="w-24 h-24 text-cyan-400 mx-auto" />}
                  {activeTab === 'multiplatform' && <Smartphone className="w-24 h-24 text-cyan-400 mx-auto" />}
                  {activeTab === 'analytics' && <BarChart3 className="w-24 h-24 text-cyan-400 mx-auto" />}

                  <p className="text-white/80 text-sm max-w-sm">
                    {currentContent.imagePlaceholder}
                  </p>
                </div>

                {/* Elementos Decorativos */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-cyan-400/20 rounded-full blur-xl"></div>
                <div className="absolute bottom-4 left-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              </motion.div>

              {/* Badge decorativo */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="absolute -top-4 -right-4 bg-cyan-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm"
              >
                ✨ Novo
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
