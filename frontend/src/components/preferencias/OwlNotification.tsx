'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles } from 'lucide-react';

interface OwlNotificationProps {
  onClose?: () => void;
}

export function OwlNotification({ onClose }: OwlNotificationProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(true);

  // Entrada animada com pequeno delay
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      setMounted(false);
      onClose?.();
    }, 400);
  };

  const handleCTA = () => {
    handleClose();
    router.push('/aluno/preferencias');
  };

  if (!mounted) return null;

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)]
        transition-all duration-400 ease-out
        ${visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
        }
      `}
    >
      {/* Card com glassmorphism */}
      <div
        className="relative flex items-start gap-4 p-5 rounded-2xl border border-white/30 shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(37, 99, 235, 0.08)',
        }}
      >
        {/* Reflexo decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-blue-50/20 pointer-events-none rounded-2xl" />

        {/* Coruja */}
        <div className="flex-shrink-0 relative">
          <img
            src="/mascot/owl-welcome.png"
            alt="Coruja"
            width={88}
            height={88}
            className="w-[88px] h-[88px] object-contain drop-shadow-md animate-[bounce_3s_ease-in-out_infinite]"
          />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 relative">
          <p className="font-semibold text-[17px] text-gray-900 leading-snug mb-1.5">
            Oi! Eu sou a Coruja
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            Vamos criar uma biblioteca que é a sua cara? Escolha suas categorias favoritas e autores para começar!
          </p>

          <button
            onClick={handleCTA}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Sparkles className="w-4 h-4" />
            Personalizar minha biblioteca
          </button>
        </div>

        {/* Botão fechar */}
        <button
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100/70 transition-all duration-150"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
