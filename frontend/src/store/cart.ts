import { create } from "zustand";
import type { Book } from "@/types/book";

export type CartItem = { book: Book; quantidade: number; precoUnit: number };

export type CartState = {
  items: CartItem[];
  add: (book: Book, qtd?: number) => void;
  remove: (id: number) => void;
  setQty: (id: number, qtd: number) => void;
  clear: () => void;
  total: () => number;
};

const readLS = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
};

const writeLS = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("cart", JSON.stringify(items));
};

export const useCart = create<CartState>((set, get) => ({
  items: readLS(),
  add: (book, qtd = 1) =>
    set((s) => {
      const found = s.items.find((i) => i.book.id === book.id);
      const precoUnit =
        book.promocao_ativa && book.preco_promocional != null
          ? book.preco_promocional
          : book.preco;

      const items = found
        ? s.items.map((i) =>
            i.book.id === book.id
              ? { ...i, quantidade: i.quantidade + qtd }
              : i
          )
        : [...s.items, { book, quantidade: qtd, precoUnit }];

      writeLS(items);
      return { items };
    }),
  remove: (id) =>
    set((s) => {
      const items = s.items.filter((i) => i.book.id !== id);
      writeLS(items);
      return { items };
    }),
  setQty: (id, qtd) =>
    set((s) => {
      const items = s.items.map((i) =>
        i.book.id === id ? { ...i, quantidade: qtd } : i
      );
      writeLS(items);
      return { items };
    }),
  clear: () => {
    writeLS([]);
    set({ items: [] });
  },
  total: () => get().items.reduce((a, i) => a + i.precoUnit * i.quantidade, 0),
}));
