'use client';

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useCart, type CartState } from "@/store/cart";
import { useCheckout, type CheckoutState } from "@/store/checkout";
import { brl } from "@/lib/currency";

export function SummaryPayment() {
  const router = useRouter();

  // Cart
  const totalFn = useCart((s: CartState) => s.total);
  const itemsLen = useCart((s: CartState) => s.items.length);
  const subtotal = totalFn();

  // Checkout
  const freight = useCheckout((s: CheckoutState) => s.freight?.value ?? 0);
  const method = useCheckout((s: CheckoutState) => s.paymentMethod);
  const coupon = useCheckout((s: CheckoutState) => s.coupon);
  const setCoupon = useCheckout((s: CheckoutState) => s.setCoupon);

  const [code, setCode] = useState("");

  // Desconto de Pix: 1% do subtotal (ajuste a taxa se quiser)
  const pixDiscount = method === "pix" ? subtotal * 0.01 : 0;

  // Cupom (ex.: 10 reais fixo se tiver qualquer código) – placeholder
  const couponDiscount = coupon?.amount ?? 0;

  const total = useMemo(
    () => Math.max(subtotal + freight - pixDiscount - couponDiscount, 0),
    [subtotal, freight, pixDiscount, couponDiscount]
  );

  const handleApplyCoupon = () => {
    const trimmedCode = code.trim();
    if (trimmedCode) {
      // Exemplo: 10 reais de desconto fixo
      // Você pode ajustar a lógica aqui conforme sua necessidade
      setCoupon(trimmedCode, 10);
    }
  };

  return (
    <aside className="bg-white rounded-2xl border p-4 h-fit">
      <h4 className="text-lg font-semibold">Resumo</h4>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Produtos ({itemsLen})</span>
          <span>{brl(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Frete</span>
          <span>{freight > 0 ? brl(freight) : "—"}</span>
        </div>
        {pixDiscount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Desconto Pix</span>
            <span>- {brl(pixDiscount)}</span>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Cupom ({coupon?.code})</span>
            <span>- {brl(couponDiscount)}</span>
          </div>
        )}
      </div>

      {/* Cupom */}
      <div className="mt-4 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Tem um código de cupom?"
          className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={handleApplyCoupon}
          className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
          disabled={!code.trim()}
        >
          Aplicar
        </button>
      </div>

      {/* Remover cupom se aplicado */}
      {coupon && (
        <button
          onClick={() => setCoupon("", 0)}
          className="mt-2 text-xs text-red-600 hover:text-red-700"
        >
          Remover cupom
        </button>
      )}

      <div className="mt-3 border-t pt-3 flex justify-between font-bold">
        <span>Total</span>
        <span>{brl(total)}</span>
      </div>

      <button
        className="mt-4 w-full rounded-xl bg-blue-600 text-white py-3 font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
        disabled={itemsLen === 0 || !method}
        onClick={() => router.push("/checkout/revisao")}
      >
        Continuar para revisão
      </button>

      <p className="text-xs text-gray-500 mt-2 text-center">
        Você poderá revisar tudo antes de finalizar o pedido.
      </p>
    </aside>
  );
}