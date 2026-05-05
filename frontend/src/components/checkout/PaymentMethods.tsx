'use client';

import { useCheckout, type CheckoutState } from "@/store/checkout";
import { CreditCard, QrCode, ReceiptText, Plus } from "lucide-react";

type Method = "pix" | "card" | "2cards" | "boleto";

function MethodCard(props: {
  active: boolean;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  icon: React.ElementType;
  onClick: () => void;
}) {
  const { active, title, subtitle, right, icon: Icon, onClick } = props;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center justify-between gap-4 rounded-2xl border p-4 transition-colors ${
        active ? "border-blue-600 bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`p-2 rounded-lg ${active ? "bg-blue-100" : "bg-gray-100"}`}>
          <Icon className={`w-5 h-5 ${active ? "text-blue-700" : "text-gray-600"}`} />
        </span>
        <div>
          <div className="font-semibold">{title}</div>
          {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
        </div>
      </div>
      {right}
    </button>
  );
}

export function PaymentMethods() {
  const method = useCheckout((s: CheckoutState) => s.paymentMethod);
  const setMethod = useCheckout((s: CheckoutState) => s.setPaymentMethod);

  return (
    <div className="space-y-3">
      <MethodCard
        active={method === "pix"}
        title="Pix"
        subtitle="Desconto automático no Pix"
        icon={QrCode}
        right={<span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">-1% no total</span>}
        onClick={() => setMethod("pix")}
      />

      <MethodCard
        active={method === "card"}
        title="Novo cartão de crédito"
        subtitle="Aprovação imediata"
        icon={CreditCard}
        right={
          <span className="flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
            <Plus className="w-3 h-3" /> Cadastrar
          </span>
        }
        onClick={() => setMethod("card")}
      />

      <MethodCard
        active={method === "2cards"}
        title="Pagar com 2 cartões"
        subtitle="Divida o valor entre dois cartões"
        icon={CreditCard}
        right={<span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Novo</span>}
        onClick={() => setMethod("2cards")}
      />

      <MethodCard
        active={method === "boleto"}
        title="Boleto bancário"
        subtitle="Aprovação em até 3 dias"
        icon={ReceiptText}
        onClick={() => setMethod("boleto")}
      />
    </div>
  );
}
