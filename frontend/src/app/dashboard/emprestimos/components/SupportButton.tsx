import React, { useState } from 'react';
import { FaWhatsapp, FaQuestion, FaTimes, FaInstagram } from 'react-icons/fa';
import { MdFeedback, MdHelp, MdVideoLibrary } from 'react-icons/md';

// Substitua pelo seu número de telefone completo
const WHATSAPP_NUMBER = '5549999999999';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

const SupportButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    {
      icon: <MdHelp size={20} />,
      title: 'Tirar uma dúvida',
      description: 'Peça ajuda sobre o sistema',
      link: WHATSAPP_LINK,
      external: true
    },
    {
      icon: <MdFeedback size={20} />,
      title: 'Enviar Feedback',
      description: 'Envie sugestões ou relate problemas',
      link: WHATSAPP_LINK,
      external: true
    },
    {
      icon: <MdVideoLibrary size={20} />,
      title: 'Central de ajuda',
      description: 'Consulte guias e artigos',
      onClick: () => alert('Ir para central de ajuda')
    },
    {
      icon: <MdVideoLibrary size={20} />,
      title: 'Canal do Youtube',
      description: 'Veja tutoriais em vídeo',
      onClick: () => alert('Ir para YouTube')
    },
    {
      icon: <FaInstagram size={20} />,
      title: 'Perfil do Instagram',
      description: 'Siga nosso perfil oficial',
      onClick: () => alert('Ir para Instagram')
    }
  ];

  return (
    <>
      {/* Overlay com blur */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 transition-all"
          onClick={toggleMenu}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        />
      )}

      {/* Menu de opções */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">👋</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Olá Leitor!</h3>
                <p className="text-sm opacity-90">Como podemos ajudar?</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="max-h-96 overflow-y-auto">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.link}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={item.onClick ? (e) => {
                  e.preventDefault();
                  item.onClick();
                } : undefined}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer group"
              >
                <div className="w-10 h-10 flex items-center justify-center text-gray-600 group-hover:text-blue-600 transition-colors">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </p>
                </div>
                <svg 
                  className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={toggleMenu}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 flex items-center justify-center"
        aria-label="Menu de Suporte"
      >
        {isOpen ? (
          <FaTimes size={18} className="transition-transform duration-200" />
        ) : (
          <FaQuestion size={16} className="transition-transform duration-200" />
        )}
      </button>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default SupportButton;