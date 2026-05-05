'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

export function LandingHeader() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm"
    >
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="Bibliotech"
              width={40}
              height={40}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Bibliotech
            </span>
          </Link>

          {/* Menu de Navegação */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#recursos"
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Recursos
            </Link>
            <Link
              href="#instituicoes"
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Instituições
            </Link>
            <Link
              href="#sobre"
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Sobre
            </Link>
            <Link
              href="#contato"
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Contato
            </Link>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-4">
            {/* Botão Eu Quero */}
            <Link
              href="#experimente"
              className="hidden md:block px-6 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-all hover:shadow-lg"
            >
              Eu Quero
            </Link>

            {/* Botão Login/Entrar */}
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all hover:shadow-lg"
            >
              <User className="w-4 h-4" />
              Entrar
            </Link>
          </div>
        </div>
      </nav>
    </motion.header>
  );
}