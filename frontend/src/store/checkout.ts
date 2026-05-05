'use client';

import { create } from 'zustand';

export type Freight = {
  service: string;
  value: number; // em reais
};

export type PaymentMethod = 'pix' | 'card' | '2cards' | 'boleto';

export type Address = {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export interface CheckoutState {
  address?: Address | null;
  setAddress: (addr: Address) => void;

  freight?: Freight | null;
  setFreight: (f: Freight | null) => void;

  paymentMethod: PaymentMethod | null;
  setPaymentMethod: (m: PaymentMethod) => void;

  coupon: { code: string; amount: number } | null; // amount em reais
  setCoupon: (code: string, amount: number) => void;
  clearCoupon: () => void;

  clearCheckout: () => void;
}

export const useCheckout = create<CheckoutState>((set) => ({
  address: null,
  setAddress: (addr) => set({ address: addr }),

  freight: null,
  setFreight: (f) => set({ freight: f }),

  paymentMethod: null,
  setPaymentMethod: (m) => set({ paymentMethod: m }),

  coupon: null,
  setCoupon: (code, amount) => set({ coupon: { code, amount } }),
  clearCoupon: () => set({ coupon: null }),

  clearCheckout: () =>
    set({
      address: null,
      freight: null,
      paymentMethod: null,
      coupon: null,
    }),
}));
