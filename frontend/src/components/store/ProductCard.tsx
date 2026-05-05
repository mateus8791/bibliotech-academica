'use client';

import { useState } from "react";
import type { Book } from "@/types/book";
import { brl } from "@/lib/currency";
import { discountPercent, parcelas } from "@/lib/price";
import { ProductModal } from "./ProductModal";

export function ProductCard({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);

  const hasPromo = !!book.promocao_ativa && !!book.preco_promocional && book.preco_promocional < book.preco;
  const precoBase = book.preco;
  const precoFinal = hasPromo ? (book.preco_promocional as number) : precoBase;
  const off = hasPromo ? discountPercent(precoBase, book.preco_promocional) : 0;
  const { qtd, valor } = parcelas(precoFinal, 3);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="rounded-2xl shadow bg-white border hover:shadow-lg transition cursor-pointer p-4 relative"
      >
        {/* Badge de desconto */}
        {hasPromo && off > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-red-600 text-white text-xs font-bold px-3 py-1">
            {off}% OFF
          </span>
        )}

        {/* Capa */}
        <div className="w-full h-64 overflow-hidden rounded-xl mb-3">
          <img
            src={book.capa_url}
            alt={book.titulo}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Título */}
        <h3 className="font-semibold line-clamp-2 min-h-[3rem]">
          {book.titulo}
        </h3>

        {/* Preços */}
        <div className="mt-2 flex items-baseline gap-2">
          {hasPromo && (
            <span className="text-sm line-through opacity-60">
              {brl(precoBase)}
            </span>
          )}
          <span className="text-lg font-bold">{brl(precoFinal)}</span>
        </div>

        {/* Parcelamento simples */}
        <div className="mt-1 text-xs text-gray-600">
          ou {qtd}x de <strong>{brl(valor)}</strong> sem juros
        </div>
      </div>

      {open && <ProductModal book={book} onClose={() => setOpen(false)} />}
    </>
  );
}
