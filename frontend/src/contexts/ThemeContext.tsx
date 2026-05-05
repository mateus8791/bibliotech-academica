/**
 * =====================================================
 * CONTEXT: Theme
 * =====================================================
 * Gerencia o tema (claro/escuro) da aplicação
 * Persiste preferência no localStorage
 * Tema padrão: claro
 * =====================================================
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Carrega o tema do localStorage na montagem
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme;
    console.log('[ThemeContext] Tema salvo no localStorage:', savedTheme);

    if (savedTheme === 'dark') {
      console.log('[ThemeContext] Aplicando tema DARK');
      setThemeState('dark');
      document.documentElement.classList.add('dark');
    } else {
      console.log('[ThemeContext] Aplicando tema LIGHT');
      setThemeState('light');
      document.documentElement.classList.remove('dark');
      if (!savedTheme) {
        console.log('[ThemeContext] Nenhum tema salvo, definindo LIGHT como padrão');
        localStorage.setItem('theme', 'light');
      }
    }
  }, []);

  // Atualiza a classe no documento quando o tema muda
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    console.log('[ThemeContext] Atualizando tema para:', theme);
    console.log('[ThemeContext] Classes atuais do HTML:', root.className);

    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      console.log('[ThemeContext] Classe DARK adicionada');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      console.log('[ThemeContext] Classe DARK removida');
    }

    console.log('[ThemeContext] Classes finais do HTML:', root.className);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      console.log('Alternando tema de', prev, 'para', newTheme);
      return newTheme;
    });
  };

  const setTheme = (newTheme: Theme) => {
    console.log('Definindo tema para:', newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}
