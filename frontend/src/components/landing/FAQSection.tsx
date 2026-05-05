'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import Image from 'next/image';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: 'geral' | 'tecnico' | 'comercial';
}

const faqs: FAQItem[] = [
  {
    id: 1,
    question: 'Como funciona o acesso à plataforma?',
    answer: 'Após a contratação, sua instituição recebe credenciais de administrador. Os usuários podem acessar via web (qualquer navegador) ou aplicativos móveis (iOS e Android). O login pode ser feito com email institucional ou integrado ao sistema acadêmico existente via SSO (Single Sign-On).',
    category: 'geral'
  },
  {
    id: 2,
    question: 'Quantos usuários podem acessar simultaneamente?',
    answer: 'Nosso sistema suporta acesso ilimitado e simultâneo de todos os usuários cadastrados. Não há limite de dispositivos ou restrições de horário. A infraestrutura em nuvem garante alta disponibilidade mesmo em períodos de pico.',
    category: 'tecnico'
  },
  {
    id: 3,
    question: 'Posso importar meu acervo físico para o sistema?',
    answer: 'Sim! Oferecemos ferramentas de importação via CSV/Excel para cadastro em lote. Nossa equipe de suporte ajuda na migração de dados do seu sistema atual. Você pode manter um catálogo híbrido, gerenciando tanto livros digitais quanto físicos na mesma plataforma.',
    category: 'tecnico'
  },
  {
    id: 4,
    question: 'Qual o período de teste disponível?',
    answer: 'Oferecemos 30 dias de trial gratuito com acesso completo a todas as funcionalidades e ao acervo de mais de 17 mil títulos. Durante esse período, sua equipe pode testar integrações, importar dados e treinar usuários sem compromisso.',
    category: 'comercial'
  },
  {
    id: 5,
    question: 'Como funciona o sistema de empréstimos digitais?',
    answer: 'Os livros digitais podem ser "emprestados" com prazos configuráveis (7, 14 ou 21 dias). Após o vencimento, o acesso é automaticamente bloqueado. Não há multas para conteúdo digital. Os alunos recebem notificações 3 dias antes do vencimento e podem renovar online se não houver fila de reserva.',
    category: 'geral'
  },
  {
    id: 6,
    question: 'A plataforma funciona offline?',
    answer: 'Sim, através dos aplicativos móveis. Os usuários podem baixar até 10 livros simultaneamente para leitura offline. O conteúdo fica disponível durante o período de empréstimo e sincroniza automaticamente quando conectado à internet.',
    category: 'tecnico'
  },
  {
    id: 7,
    question: 'Quais editoras fazem parte do acervo?',
    answer: 'Temos parceria com mais de 80 editoras acadêmicas, incluindo Pearson, Grupo A, Saraiva, Atlas, Manole, Artmed, Bookman, e muitas outras. O catálogo abrange todas as áreas do conhecimento com títulos atualizados constantemente.',
    category: 'geral'
  },
  {
    id: 8,
    question: 'Como é feita a cobrança?',
    answer: 'O modelo de assinatura é anual com valores baseados no número de alunos ativos da instituição. Incluímos acesso ilimitado ao acervo completo, suporte técnico prioritário, treinamentos e atualizações sem custo adicional. Oferecemos descontos para contratos plurianuais.',
    category: 'comercial'
  },
  {
    id: 9,
    question: 'Posso integrar com meu sistema acadêmico (LMS)?',
    answer: 'Sim! Oferecemos integração via API REST com os principais sistemas: Moodle, Canvas, Blackboard, Google Classroom e sistemas proprietários. A integração permite login único (SSO), sincronização de turmas e incorporação de conteúdo diretamente nas aulas.',
    category: 'tecnico'
  },
  {
    id: 10,
    question: 'Como funciona o suporte técnico?',
    answer: 'Oferecemos suporte multicanal: email, chat ao vivo (horário comercial), base de conhecimento online e gerente de sucesso dedicado para instituições corporativas. Tempo médio de resposta: 2 horas para questões críticas e 24 horas para dúvidas gerais.',
    category: 'comercial'
  },
];

const categories = [
  { id: 'todas', label: 'Todas' },
  { id: 'geral', label: 'Gerais' },
  { id: 'tecnico', label: 'Técnicas' },
  { id: 'comercial', label: 'Comerciais' },
];

export function FAQSection() {
  const [openId, setOpenId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('todas');

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  const filteredFAQs = activeCategory === 'todas'
    ? faqs
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-6">
        {/* Ilustração + Título */}
        <div className="text-center mb-12">
          {/* Ilustração */}
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-64 h-64 md:w-80 md:h-80"
            >
              <Image
                src="/images/bibliotecapessoas.png"
                alt="Ilustração de pessoas lendo na biblioteca"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[#003366] mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tire suas dúvidas sobre a plataforma, recursos técnicos e modelo de contratação
          </p>
        </div>

        {/* Filtros de Categoria */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                px-6 py-2 rounded-full font-semibold text-sm transition-all
                ${activeCategory === category.id
                  ? 'bg-[#006BA6] text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }
              `}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Acordeão de FAQs */}
        <div className="space-y-4">
          <AnimatePresence mode="sync">
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Pergunta (Cabeçalho Clicável) */}
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-[#003366] pr-4">
                    {faq.question}
                  </span>
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all
                    ${openId === faq.id ? 'bg-[#006BA6] text-white rotate-180' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {openId === faq.id ? (
                      <Minus className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Resposta (Expansível) */}
                <AnimatePresence>
                  {openId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2">
                        <p className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* CTA de Contato */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center bg-gradient-to-r from-[#006BA6] to-[#003366] rounded-2xl p-8 md:p-12 text-white"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Ainda tem dúvidas?
          </h3>
          <p className="text-cyan-100 mb-6 max-w-2xl mx-auto">
            Nossa equipe de especialistas está pronta para ajudar você a escolher a melhor solução para sua instituição
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-[#006BA6] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
              Falar com Consultor
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Agendar Demonstração
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
