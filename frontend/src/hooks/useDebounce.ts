// Arquivo: frontend/src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

// Este hook recebe um valor (como um termo de busca) e um atraso em milissegundos
export function useDebounce<T>(value: T, delay: number): T {
  // Estado para armazenar o valor "atrasado"
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Cria um temporizador que só vai atualizar o valor "atrasado"
    // depois que o tempo do 'delay' passar
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Isso é importante: se o 'value' mudar de novo antes do tempo acabar,
    // o temporizador antigo é limpo e um novo é criado.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // O efeito só roda se o valor ou o delay mudarem

  return debouncedValue;
}