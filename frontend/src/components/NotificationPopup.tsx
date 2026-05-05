// frontend/src/components/NotificationPopup.tsx
'use client';

import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react'; // Importe o ícone X para fechar

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  overdueCount: number;
  daysInactive: number | null;
  showInactivityWarning: boolean;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  isOpen,
  onClose,
  overdueCount,
  daysInactive,
  showInactivityWarning,
}) => {
  const hasOverdue = overdueCount > 0;
  const hasNotifications = hasOverdue || showInactivityWarning;

  // Não renderiza nada se não estiver aberto ou não tiver notificações
  if (!isOpen || !hasNotifications) {
    return null;
  }

  return (
    // Fundo semi-transparente para o modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose} // Fecha ao clicar fora do conteúdo
    >
      {/* Container do conteúdo do modal */}
      <div
        className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl mx-4 sm:mx-0"
        onClick={(e) => e.stopPropagation()} // Evita que o clique dentro feche o modal
      >
        {/* Botão de Fechar no canto superior direito */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Cabeçalho */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {(hasOverdue) && <AlertTriangle className="text-yellow-500 h-5 w-5" />}
            {(!hasOverdue && showInactivityWarning) && <Info className="text-blue-500 h-5 w-5" />}
            Avisos da Biblioteca
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Temos algumas informações para você:
          </p>
        </div>

        {/* Corpo com as notificações */}
        <div className="space-y-3 mb-6">
          {hasOverdue && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
               <AlertTriangle className="text-yellow-600 h-5 w-5 mt-0.5 flex-shrink-0" />
               <p className="text-sm text-yellow-800">
                 Você possui <strong>{overdueCount} {overdueCount === 1 ? 'livro atrasado' : 'livros atrasados'}</strong>. Por favor, realize a devolução o quanto antes para evitar multas.
               </p>
            </div>
          )}
          {showInactivityWarning && daysInactive !== null && (
             <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <Info className="text-blue-600 h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Faz <strong>{daysInactive} {daysInactive === 1 ? 'dia' : 'dias'}</strong> que você não pega um livro emprestado ou faz uma reserva. Que tal explorar nosso catálogo?
                </p>
             </div>
          )}
        </div>

        {/* Rodapé com o botão de fechar */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;