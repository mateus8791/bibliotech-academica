'use client';

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartState } from "@/store/cart";
import { brl } from "@/lib/currency";

export function CartList() {
  // ⚠️ Chame o hook uma vez por campo (evita o erro do Zustand/TS)
  const items = useCart((s: CartState) => s.items);
  const setQty = useCart((s: CartState) => s.setQty);
  const remove = useCart((s: CartState) => s.remove);
  const total = useCart((s: CartState) => s.total);

  const router = useRouter();
  const subtotal = useMemo(() => total(), [items, total]);

  if (!items || items.length === 0) {
    // Se quiser, retorne null e deixe o EmptyBag ser renderizado pelo parent
    return null;
  }

  return (
    <div className="grid md:grid-cols-[1fr,320px] gap-8">
      {/* Lista */}
      <div className="bg-white rounded-2xl border p-4 divide-y">
        {items.map(({ book, quantidade, precoUnit }) => (
          <div key={book.id} className="py-4 flex gap-4">
            <img
              src={book.capa_url}
              alt={book.titulo}
              className="w-24 h-32 object-cover rounded-lg border"
            />

            <div className="flex-1">
              <h3 className="font-semibold">{book.titulo}</h3>

              {book.autores?.length ? (
                <p className="text-sm text-gray-500 mt-1">
                  {book.autores.map(a => a.nome).join(", ")}
                </p>
              ) : null}

              <div className="mt-3 flex items-center gap-3">
                <label className="text-sm text-gray-600">Quantidade:</label>

                <select
                  className="border rounded-lg px-3 py-1"
                  value={quantidade}
                  onChange={e => setQty(book.id, Number(e.target.value))}
                >
                  {Array.from({ length: 10 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>

                <button
                  className="text-sm text-red-600 underline ml-2"
                  onClick={() => remove(book.id)}
                >
                  Excluir
                </button>
              </div>
            </div>

            <div className="text-right whitespace-nowrap">
              <div className="font-bold">{brl(precoUnit)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {quantidade} × {brl(precoUnit)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo */}
      <aside className="bg-white rounded-2xl border p-4 h-fit">
        <h4 className="text-lg font-semibold">Resumo</h4>

        <div className="mt-4 flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{brl(subtotal)}</span>
        </div>

        {/* Frete calculado depois (Entrega) */}
        <div className="mt-2 flex justify-between text-sm">
          <span>Frete</span>
          <span>—</span>
        </div>

        <div className="mt-3 border-t pt-3 flex justify-between font-bold">
          <span>Total</span>
          <span>{brl(subtotal)}</span>
        </div>

        <button
          className="mt-4 w-full rounded-xl bg-blue-600 text-white py-3 font-semibold hover:brightness-110 disabled:opacity-50"
          disabled={items.length === 0}
          onClick={() => router.push("/checkout/entrega")}
        >
          Continuar para entrega
        </button>

        <p className="text-xs text-gray-500 mt-2">
          O frete é calculado na próxima etapa. Você poderá revisar tudo antes de pagar.
        </p>
      </aside>
    </div>
  );
}
