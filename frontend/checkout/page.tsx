'use client';

// --- ADICIONADO: useEffect e useRef ---
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Interface simples para os itens do carrinho
interface CartItem {
  id: number;
  livroId: number;
  titulo: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([
    // Mock de itens
    { id: 1, livroId: 101, titulo: 'O Senhor dos Anéis', quantidade: 1, precoUnitario: 59.90, subtotal: 59.90 },
    { id: 2, livroId: 102, titulo: '1984', quantidade: 1, precoUnitario: 35.50, subtotal: 35.50 },
  ]);
  const [status, setStatus] = useState<'initial' | 'waiting_payment_options' | 'selecting_payment' | 'confirming_payment' | 'completed' | 'error'>('initial');
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  // --- ADICIONADO: Refs para guardar os IDs dos timers ---
  const timer1Ref = useRef<NodeJS.Timeout | null>(null);
  const timer2Ref = useRef<NodeJS.Timeout | null>(null);

  const calculateTotal = () => {
    return cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  };

  const handleConfirmPurchase = () => {
    console.log("Clicou em Confirmar Compra - Mudando status para waiting_payment_options");
    setStatus('waiting_payment_options');
    // A lógica do timer agora está no useEffect
  };

  const handleSelectPayment = (method: string) => {
    console.log("Selecionou Pagamento:", method);
    setSelectedPaymentMethod(method);
    console.log("Mudando status para confirming_payment");
    setStatus('confirming_payment');
    // A lógica do timer agora está no useEffect
  };

  const handleFinalConfirm = () => {
    console.log("Confirmando pagamento final para o pedido:", pedidoId, "com método:", selectedPaymentMethod);
    // TODO: Adicionar chamada real ao backend aqui
    // Por agora, simulamos sucesso e redirecionamos
    setStatus('completed'); // Muda status para concluído (opcional)
    router.push(`/pedido/confirmacao/123`); // ID mockado
  };

  // --- ADICIONADO: useEffect para gerenciar os timers ---
  useEffect(() => {
    // Limpa timers anteriores ao mudar o status
    if (timer1Ref.current) clearTimeout(timer1Ref.current);
    if (timer2Ref.current) clearTimeout(timer2Ref.current);

    if (status === 'waiting_payment_options') {
      console.log("Iniciando Timer 1 (30s) para mostrar opções de pagamento");
      timer1Ref.current = setTimeout(() => {
        console.log("Timer 1 concluído - Mudando status para selecting_payment");
        setStatus('selecting_payment');
      }, 30000); // 30 segundos
    } else if (status === 'confirming_payment') {
      console.log("Iniciando Timer 2 (30s) para confirmar pagamento");
      timer2Ref.current = setTimeout(() => {
        console.log("Timer 2 concluído - Chamando handleFinalConfirm");
        handleFinalConfirm();
      }, 30000); // 30 segundos
    }

    // Função de limpeza: será chamada quando o componente desmontar ou antes de rodar o efeito novamente
    return () => {
      if (timer1Ref.current) clearTimeout(timer1Ref.current);
      if (timer2Ref.current) clearTimeout(timer2Ref.current);
      console.log("Limpando timers no useEffect cleanup");
    };
  }, [status]); // Este efeito depende do estado 'status'

  // Estilos Base Tailwind para os botões HTML
  const baseButtonStyle = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const defaultVariantStyle = "bg-gray-900 text-gray-50 hover:bg-gray-900/90 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90";
  const defaultSizeStyle = "h-10 px-4 py-2";
  const largeSizeStyle = "h-11 rounded-md px-8 text-lg";

  const buttonStyle = `${baseButtonStyle} ${defaultVariantStyle} ${defaultSizeStyle}`;
  const largeButtonStyle = `${baseButtonStyle} ${defaultVariantStyle} ${largeSizeStyle}`;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-center">Finalizar Compra</h1>

      {/* --- Seção de Revisão dos Itens --- */}
      <div className="border rounded-lg shadow-md mb-6 bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Resumo do Pedido</h2>
        </div>
        <div className="p-4">
          {cartItems.length === 0 ? (
            <p>Seu carrinho está vazio.</p>
          ) : (
            <ul className="space-y-3">
              {cartItems.map(item => (
                <li key={item.id} className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
                  <div>
                    <p className="font-medium">{item.titulo}</p>
                    <p className="text-sm text-gray-600">Qtd: {item.quantidade} x R$ {item.precoUnitario.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <p className="font-semibold">R$ {item.subtotal.toFixed(2).replace('.', ',')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="p-4 border-t flex justify-end font-bold text-lg">
            Total: R$ {calculateTotal().toFixed(2).replace('.', ',')}
          </div>
        )}
      </div>

      {/* --- Seção de Controle do Fluxo --- */}
      <div className="text-center space-y-4 mt-8">
        {status === 'initial' && cartItems.length > 0 && (
          <button className={largeButtonStyle} onClick={handleConfirmPurchase}>
            Confirmar Compra
          </button>
        )}

        {status === 'waiting_payment_options' && (
          <p className="text-gray-600 animate-pulse">Aguardando 30s para opções de pagamento...</p>
          // TODO (Opcional): Adicionar contador regressivo visual
        )}

        {status === 'selecting_payment' && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Escolha a forma de pagamento:</h2>
            <div className="flex justify-center gap-4">
              <button className={buttonStyle} onClick={() => handleSelectPayment('Pix')}>Pix</button>
              <button className={buttonStyle} onClick={() => handleSelectPayment('Cartão de Crédito')}>Cartão de Crédito</button>
            </div>
          </div>
        )}

        {status === 'confirming_payment' && (
          <p className="text-gray-600 animate-pulse">Processando pagamento via {selectedPaymentMethod}... Aguarde 30s...</p>
          // TODO (Opcional): Adicionar contador regressivo visual
        )}

        {status === 'completed' && (
          <p className="text-green-600 font-semibold">Pedido concluído! Redirecionando...</p>
        )}

        {status === 'error' && (
          <>
            <p className="text-red-500 font-semibold">Ocorreu um erro ao processar seu pedido.</p>
            {/* TODO: Adicionar botão para tentar novamente ou voltar */}
          </>
        )}
      </div>
    </div>
  );
}
