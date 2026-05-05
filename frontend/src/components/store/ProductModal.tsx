'use client';

import type { Book } from "@/types/book";
// ESCOLHA UMA das três imports abaixo e mantenha só UMA delas:
// import { useCart, type CartState } from "@/store/cart";
// import { useCart, type CartState } from "store/cart";
import { useCart, type CartState } from "../../store/cart";

import { brl } from "@/lib/currency";
import { discountPercent, parcelas } from "@/lib/price";
import { useEffect } from "react";

export function ProductModal({ book, onClose }: { book: Book; onClose: () => void }) {
  const add = useCart((state: CartState) => state.add);

  const hasPromo =
    !!book.promocao_ativa &&
    book.preco_promocional != null &&
    book.preco_promocional < book.preco;

  const precoBase = book.preco;
  const precoFinal = hasPromo ? (book.preco_promocional as number) : precoBase;
  const off = hasPromo ? discountPercent(precoBase, book.preco_promocional) : 0;
  const { qtd, valor } = parcelas(precoFinal, 3);

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full grid md:grid-cols-2 gap-6 p-6 relative" onClick={(e) => e.stopPropagation()}>
        {hasPromo && off > 0 && (
          <span className="absolute left-6 top-6 z-10 rounded-full bg-red-600 text-white text-xs font-bold px-3 py-1">
            {off}% OFF
          </span>
        )}

        <img src={book.capa_url} className="w-full h-96 object-cover rounded-xl" alt={book.titulo} />

        <div>
          <h2 className="text-2xl font-bold">{book.titulo}</h2>

          {book.autores?.length ? (
            <p className="mt-1 text-sm text-gray-600">de {book.autores.map((a) => a.nome).join(", ")}</p>
          ) : null}

          {book.categorias?.length ? (
            <p className="text-xs text-gray-500 mt-1">{book.categorias.map((c) => c.nome).join(" • ")}</p>
          ) : null}

          <div className="mt-4 flex items-center gap-2">
            {hasPromo && <span className="text-sm line-through opacity-60">{brl(precoBase)}</span>}
            <span className="text-2xl font-bold">{brl(precoFinal)}</span>
          </div>

          <div className="mt-1 text-sm text-gray-600">
            ou {qtd}x de <strong>{brl(valor)}</strong> sem juros
          </div>

          {book.sinopse && <p className="mt-4 text-sm opacity-80 line-clamp-6">{book.sinopse}</p>}

          <button
            className="mt-6 w-full rounded-2xl bg-blue-600 text-white py-3 font-semibold hover:brightness-110"
            onClick={() => {
              add(book, 1);
              onClose();
            }}
          >
            Adicionar à sacola
          </button>
        </div>
      </div>
    </div>
  );
}
