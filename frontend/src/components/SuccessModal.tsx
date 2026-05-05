// Arquivo: frontend/src/components/SuccessModal.tsx
'use client';

import { PartyPopper, X } from 'lucide-react';

// Define as propriedades que o nosso modal vai receber
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  children,
}: SuccessModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    // Overlay escuro que cobre a tela inteira
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      {/* Caixa do Modal */}
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md mx-auto relative animate-fade-in-up text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
            <PartyPopper className="text-green-600" size={48} />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-4">{title}</h2>
        
        <div className="my-4 text-gray-600 space-y-3">
          {children}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 px-5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
          >
            Ver Meus Livros
          </button>
        </div>
      </div>
    </div>
  );
}
