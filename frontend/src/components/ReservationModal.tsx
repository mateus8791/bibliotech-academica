'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2, BookMarked, Sparkles, AlertTriangle, Clock } from 'lucide-react';
import Image from 'next/image';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dataRetirada: string) => void;
  bookTitle: string;
  bookCover?: string | null;
  bookAuthor?: string | null;
  bookCategory?: string | null;
  isAvailable?: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
}

// Mapeamento de categorias para owls 3D (pasta /public/mascot/3d/)
const OWL_3D: Record<string, string> = {
  romance: '/mascot/3d/owl-romance-3d.png',
  drama:   '/mascot/3d/owl-romance-3d.png',
  poesia:  '/mascot/3d/owl-romance-3d.png',
};

// Mapeamento de categorias para owls 2D (fallback)
const OWL_2D: Record<string, string> = {
  romance:  '/mascot/owl-romance.png',
  drama:    '/mascot/owl-romance.png',
  poesia:   '/mascot/owl-romance.png',
  aventura: '/mascot/owl-adventure.png',
  policial: '/mascot/owl-adventure.png',
  suspense: '/mascot/owl-adventure.png',
  mistério: '/mascot/owl-adventure.png',
  misterio: '/mascot/owl-adventure.png',
  'hq':     '/mascot/owl-creative.png',
  mangá:    '/mascot/owl-creative.png',
  manga:    '/mascot/owl-creative.png',
  humor:    '/mascot/owl-creative.png',
  autoajuda:'/mascot/owl-creative.png',
  contos:   '/mascot/owl-creative.png',
  biografia:   '/mascot/owl-knowledge.png',
  história:    '/mascot/owl-knowledge.png',
  historia:    '/mascot/owl-knowledge.png',
  'ficção':    '/mascot/owl-knowledge.png',
  ficcao:      '/mascot/owl-knowledge.png',
  clássicos:   '/mascot/owl-knowledge.png',
  classicos:   '/mascot/owl-knowledge.png',
  fantasia:    '/mascot/owl-knowledge.png',
  terror:      '/mascot/owl-knowledge.png',
};

const getCategoryOwl = (category: string | null | undefined): string => {
  if (!category) return '/mascot/owl-reservation.png';
  const cat = category.toLowerCase();
  // Tenta owl 3D primeiro, depois 2D, senão usa o padrão
  const key = Object.keys(OWL_3D).find(k => cat.includes(k));
  if (key) return OWL_3D[key];
  const key2d = Object.keys(OWL_2D).find(k => cat.includes(k));
  if (key2d) return OWL_2D[key2d];
  return '/mascot/owl-reservation.png';
};

type StepMessages = { title: string; tip: string };

const getStepMessages = (category: string | null | undefined, step: number): StepMessages => {
  if (step === 2) return {
    title: '"Escolha bem o dia... a coruja tem agenda cheia! 📅"',
    tip: 'Lembre-se: devoluções atrasadas geram multa por dia!',
  };
  if (step === 3) return {
    title: '"ARRASOU! Só confirmar e o livro é seu! 🎉"',
    tip: 'Após confirmar, você receberá uma notificação quando o livro estiver disponível.',
  };

  if (!category) return { title: '"Boa escolha! A coruja aprova! 📚"', tip: 'Reserve com antecedência e garanta sua leitura preferida!' };
  const cat = category.toLowerCase();
  if (['romance', 'drama', 'poesia'].some(c => cat.includes(c)))
    return { title: '"Que escolha apaixonante! Prepare os lenços! 💕"', tip: 'Livros de romance são perfeitos para relaxar no fim do dia!' };
  if (['aventura', 'policial', 'suspense', 'mistério', 'misterio'].some(c => cat.includes(c)))
    return { title: '"Aventura garantida! Segura o chapéu! 🚀"', tip: 'Suspense e aventura: impossível parar de ler!' };
  if (['hq', 'mangá', 'manga', 'humor', 'autoajuda', 'contos'].some(c => cat.includes(c)))
    return { title: '"Sua imaginação vai decolar por aqui! 🎨"', tip: 'Humor e criatividade são os melhores remédios!' };
  if (['biografia', 'história', 'historia', 'ficção', 'ficcao', 'clássicos', 'classicos', 'fantasia', 'terror'].some(c => cat.includes(c)))
    return { title: '"Modo nerd: ATIVADO! Aproveite a jornada! 🧠"', tip: 'Conhecimento é poder! Este livro vai expandir sua mente.' };

  return { title: '"Boa escolha! A coruja aprova! 📚"', tip: 'Reserve com antecedência e garanta sua leitura preferida!' };
};

const STEPS = ['Livro', 'Data', 'Confirmar'];
const LOAN_DAYS = 14; // dias padrão de empréstimo
const FINE_PER_DAY = 'R$ 1,00'; // multa por dia de atraso

export default function ReservationModal({
  isOpen, onClose, onConfirm,
  bookTitle, bookCover, bookAuthor, bookCategory,
  isAvailable = true, isSubmitting, errorMessage,
}: ReservationModalProps) {
  const [step, setStep] = useState(1);
  const [dataRetirada, setDataRetirada] = useState('');

  useEffect(() => {
    if (isOpen) { setStep(1); setDataRetirada(''); }
  }, [isOpen]);

  if (!isOpen) return null;

  const owlSrc = step === 3 ? '/mascot/owl-success.png' : getCategoryOwl(bookCategory);
  const { title: catTitle, tip: catTip } = getStepMessages(bookCategory, step);

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  };

  const getReturnDate = (pickup: string): string => {
    if (!pickup) return '';
    const date = new Date(pickup);
    date.setDate(date.getDate() + LOAN_DAYS);
    return date.toISOString().split('T')[0];
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    const [year, month, day] = d.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleNext = () => {
    if (step === 2 && !dataRetirada) { alert('Por favor, selecione uma data para a retirada.'); return; }
    setStep(s => s + 1);
  };

  const dataDevolucao = getReturnDate(dataRetirada);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-auto relative animate-fade-in-up">

        {/* Header azul */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-7 pt-6 pb-7 rounded-t-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-blue-800/50 rounded-full p-2.5">
              <BookMarked size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-xl">Confirmar Reserva</h3>
              <p className="text-blue-100 text-sm">Complete os dados para retirar seu livro</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-1.5 rounded-full hover:bg-blue-500/50"
            >
              <X size={24} />
            </button>
          </div>

          {/* Indicador de passos */}
          <div className="flex items-center justify-center">
            {STEPS.map((label, i) => {
              const num = i + 1;
              const active = step === num;
              const done = step > num;
              return (
                <div key={label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      done ? 'bg-green-400 text-white' : active ? 'bg-white text-blue-700' : 'bg-blue-500/50 text-blue-100'
                    }`}>
                      {done ? '✓' : num}
                    </div>
                    <span className={`text-xs mt-1 ${active ? 'text-white font-semibold' : 'text-blue-200'}`}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-20 h-0.5 mb-4 mx-1 transition-all duration-300 ${done ? 'bg-green-400' : 'bg-blue-500/50'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Corpo com owl */}
        <div className="flex items-start gap-5 px-7 pt-3 pb-2">
          {/* Owl com margem negativa para sobrepor o header */}
          <div className="flex-shrink-0 -mt-14 z-10">
            <Image
              src={owlSrc}
              alt="Coruja mascote"
              width={130}
              height={130}
              className="object-contain drop-shadow-2xl transition-all duration-500"
            />
          </div>

          {/* Conteúdo do passo */}
          <div className="flex-1 pt-2 min-h-[130px]">
            <p className="text-sm font-semibold text-blue-600 italic mb-3 leading-snug">{catTitle}</p>

            {/* Passo 1 — info do livro */}
            {step === 1 && (
              <div className="border border-gray-200 rounded-xl p-3 flex items-center gap-3 bg-gray-50">
                <div className="relative w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
                  <Image src={bookCover || '/covers/placeholder-icon.png'} alt={bookTitle} fill className="object-cover" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base leading-tight">{bookTitle}</p>
                  {bookAuthor && <p className="text-sm text-gray-500 mt-0.5">{bookAuthor}</p>}
                  {bookCategory && <p className="text-xs text-blue-500 mt-0.5">{bookCategory}</p>}
                  <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isAvailable ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {isAvailable ? 'Disponível' : 'Indisponível agora'}
                  </span>
                </div>
              </div>
            )}

            {/* Passo 2 — datas */}
            {step === 2 && (
              <div className="space-y-3">
                {/* Data de retirada */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Calendar size={12} className="text-blue-500" />
                    Data de Retirada <span className="text-red-500">*</span>
                  </p>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                    <input
                      type="date"
                      value={dataRetirada}
                      onChange={e => setDataRetirada(e.target.value)}
                      min={getMinDate()}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 text-sm"
                    />
                  </div>
                </div>

                {/* Data de devolução (calculada automaticamente) */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Clock size={12} className="text-orange-500" />
                    Data de Devolução
                    <span className="text-gray-400 font-normal normal-case">(calculada automaticamente)</span>
                  </p>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={16} />
                    <div className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm ${
                      dataDevolucao
                        ? 'border-orange-200 bg-orange-50 text-orange-800 font-semibold'
                        : 'border-gray-100 bg-gray-50 text-gray-400 italic'
                    }`}>
                      {dataDevolucao ? formatDate(dataDevolucao) : `Selecione a retirada (prazo: ${LOAN_DAYS} dias)`}
                    </div>
                  </div>
                </div>

                {/* Aviso de multa */}
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-700">Atenção — Multa por Atraso</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Devoluções após a data prevista serão cobradas {FINE_PER_DAY} por dia de atraso.
                      Evite multas devolvendo no prazo! 🦉
                    </p>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl">{errorMessage}</div>
                )}
              </div>
            )}

            {/* Passo 3 — resumo */}
            {step === 3 && (
              <div className="border border-blue-100 rounded-xl p-3 bg-blue-50 space-y-2.5">
                <div className="flex items-start gap-2">
                  <BookMarked size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{bookTitle}</p>
                    {bookAuthor && <p className="text-xs text-gray-500">{bookAuthor}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Retirada até <strong className="text-blue-700">{formatDate(dataRetirada)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-orange-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Devolver até <strong className="text-orange-600">{formatDate(dataDevolucao)}</strong>
                    <span className="text-xs text-gray-400 ml-1">({LOAN_DAYS} dias)</span>
                  </span>
                </div>
                <div className="flex items-start gap-2 pt-1 border-t border-blue-200">
                  <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-600">Atrasos geram multa de {FINE_PER_DAY}/dia.</p>
                </div>
                {errorMessage && (
                  <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-xl">{errorMessage}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dica da Coruja */}
        <div className="mx-7 my-3 bg-blue-50 rounded-xl p-3 flex items-center gap-3">
          <Image src="/mascot/3d/owl-romance-3d.png" alt="Coruja dica" width={52} height={52} className="object-contain flex-shrink-0 drop-shadow-md" />
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-700">Dica da Coruja 💙</p>
            <p className="text-xs text-gray-500">{catTip}</p>
          </div>
          <Sparkles size={18} className="text-blue-300 flex-shrink-0" />
        </div>

        {/* Botões */}
        <div className="border-t border-gray-100 px-7 py-4 flex gap-3 rounded-b-2xl">
          <button
            onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            {step === 1 ? 'Cancelar' : '← Voltar'}
          </button>
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={step === 2 && !dataRetirada}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              Próximo →
            </button>
          ) : (
            <button
              onClick={() => onConfirm(dataRetirada)}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Reservando...' : 'Confirmar Reserva!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
