'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';

export function LandingFooter() {

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      {/* Seção Principal do Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Coluna 1 - Logo e Sobre */}
          <div className="space-y-6">
            <Image
              src="/logo.png"
              alt="Biblioteca Virtual"
              width={150}
              height={50}
              className="h-12 w-auto"
            />

            <p className="text-gray-600 text-sm leading-relaxed">
              Transformando a experiência de leitura acadêmica com tecnologia e inovação.
            </p>

            <div className="flex items-center space-x-4">
              <Link href="#" className="text-gray-600 hover:text-[#006BA6] transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-[#006BA6] transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-[#006BA6] transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Coluna 2 - Navegação */}
          <div>
            <h4 className="text-[#003366] font-bold text-sm mb-4 uppercase">Navegação</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-gray-600 hover:text-[#006BA6] text-sm transition-colors">Home</Link></li>
              <li><Link href="/auth/login" className="text-gray-600 hover:text-[#006BA6] text-sm transition-colors">Acessar Sistema</Link></li>
              <li><Link href="/faq" className="text-gray-600 hover:text-[#006BA6] text-sm transition-colors">Perguntas Frequentes</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-[#006BA6] text-sm transition-colors">Sobre Nós</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-[#006BA6] text-sm transition-colors">Contato</Link></li>
            </ul>
          </div>

          {/* Coluna 3 - Recursos */}
          <div>
            <h4 className="text-[#003366] font-bold text-sm mb-4 uppercase">Recursos</h4>
            <ul className="space-y-3">
              <li><Link href="/auth/login" className="text-gray-600 hover:text-[#006BA6] text-sm transition-colors">Catálogo de Livros</Link></li>
              <li><Link href="/auth/login" className="text-gray-600 hover:text-[#006BA6] text-sm transition-colors">Meus Empréstimos</Link></li>
              <li><Link href="/auth/login" className="text-gray-600 hover:text-[#006BA6] text-sm transition-colors">Área Administrativa</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-[#006BA6] text-sm transition-colors">Suporte</Link></li>
            </ul>
          </div>

          {/* Coluna 4 - Aplicativo */}
          <div>
            <h4 className="text-[#003366] font-bold text-sm mb-4 uppercase">Aplicativo</h4>
            <p className="text-gray-600 text-sm mb-4">Baixe nosso app e leia onde quiser</p>

            <div className="space-y-2">
              <Link href="#" className="flex items-center space-x-2 px-4 py-2 border-2 border-[#006BA6] rounded-lg text-[#006BA6] hover:bg-[#006BA6] hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
                </svg>
                <span className="text-sm font-medium">App Store</span>
              </Link>
              <Link href="#" className="flex items-center space-x-2 px-4 py-2 border-2 border-[#006BA6] rounded-lg text-[#006BA6] hover:bg-[#006BA6] hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <span className="text-sm font-medium">Google Play</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Inferior */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Bibliotech. Todos os direitos reservados.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link href="#" className="text-gray-600 hover:text-[#006BA6] transition-colors">Política de Privacidade</Link>
              <Link href="#" className="text-gray-600 hover:text-[#006BA6] transition-colors">Termos de Uso</Link>
              <Link href="#" className="text-gray-600 hover:text-[#006BA6] transition-colors">Acessibilidade</Link>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span>Desenvolvido por</span>
              <Image
                src="/logoSoftAIc.png"
                alt="SoftAIC"
                width={70}
                height={25}
                className="h-6 w-auto opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Voltar ao Topo */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 bg-[#006BA6] text-white p-3 rounded-full shadow-lg hover:bg-[#005A8C] transition-all hover:scale-110"
        aria-label="Voltar ao topo"
      >
        <ArrowUp size={24} />
      </button>
    </footer>
  );
}
