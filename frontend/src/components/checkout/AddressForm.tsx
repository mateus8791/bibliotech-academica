'use client';

import { useEffect, useRef, useState } from "react";
import { useCheckout } from "@/store/checkout";

type Address = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
};

const initialAddress: Address = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};

export function AddressForm() {
  const [addr, setAddr] = useState<Address>(initialAddress);
  const [loadingCep, setLoadingCep] = useState(false);
  const [errorCep, setErrorCep] = useState<string | null>(null);

  const setFreight = useCheckout(s => s.setFreight);

  // ✅ evita buscar CEP repetidamente: só busca no blur
  const handleCepBlur = async () => {
    const cep = addr.cep.replace(/\D/g, "");
    if (cep.length !== 8) {
      setErrorCep("CEP inválido. Use 8 dígitos.");
      return;
    }
    setErrorCep(null);
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErrorCep("CEP não encontrado.");
      } else {
        setAddr(prev => ({
          ...prev,
          street: data.logradouro ?? prev.street,
          district: data.bairro ?? prev.district,
          city: data.localidade ?? prev.city,
          state: data.uf ?? prev.state,
        }));
      }
    } catch {
      setErrorCep("Falha ao consultar CEP.");
    } finally {
      setLoadingCep(false);
    }
  };

  // ✅ calcula frete somente quando o usuário clicar (ou quando endereço estiver válido)
  const handleCalcFrete = () => {
    // Regra simples de exemplo: estados do Sudeste = mais barato
    const sudeste = ["SP", "RJ", "MG", "ES"];
    const base = sudeste.includes(addr.state.toUpperCase()) ? 14.9 : 24.9;
    const eta = sudeste.includes(addr.state.toUpperCase()) ? "2-4 dias úteis" : "5-8 dias úteis";

    // ✅ seta no store (apenas aqui, não em efeito sem dependências estáveis)
    // Removido 'eta' porque o tipo Freight não o aceita; manter o prazo localmente se necessário.
    setFreight({
      value: base,
      service: "Econômico",
    });

    // Se quiser usar o prazo estimado localmente:
    // console.log("Prazo estimado:", eta);
  };

  // Guarda para impedir submit inadvertido
  const submittedRef = useRef(false);

  useEffect(() => {
    // Apenas para limpar flag se o usuário voltar ao formulário
    submittedRef.current = false;
  }, []);

  return (
    <div className="bg-white rounded-2xl border p-4">
      <h3 className="text-lg font-semibold">Endereço de entrega</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="md:col-span-1">
          <label className="text-sm text-gray-600">CEP</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="00000-000"
            value={addr.cep}
            onChange={e => setAddr(a => ({ ...a, cep: e.target.value }))}
            onBlur={handleCepBlur} // ✅ busca CEP só no blur
          />
          {loadingCep && <p className="text-xs text-gray-500 mt-1">Consultando CEP…</p>}
          {errorCep && <p className="text-xs text-red-600 mt-1">{errorCep}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-600">Rua</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={addr.street}
            onChange={e => setAddr(a => ({ ...a, street: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Número</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={addr.number}
            onChange={e => setAddr(a => ({ ...a, number: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Complemento</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={addr.complement}
            onChange={e => setAddr(a => ({ ...a, complement: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Bairro</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={addr.district}
            onChange={e => setAddr(a => ({ ...a, district: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Cidade</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={addr.city}
            onChange={e => setAddr(a => ({ ...a, city: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">UF</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            maxLength={2}
            value={addr.state}
            onChange={e => setAddr(a => ({ ...a, state: e.target.value.toUpperCase() }))}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          className="rounded-xl bg-blue-600 text-white px-4 py-2 font-semibold hover:brightness-110 disabled:opacity-50"
          onClick={handleCalcFrete}
          disabled={!addr.cep || !addr.street || !addr.number || !addr.city || !addr.state}
        >
          Calcular frete
        </button>

        <span className="text-xs text-gray-500">
          Use o CEP e endereço para calcular frete e prazo.
        </span>
      </div>
    </div>
  );
}
