type ViaCep = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export function onlyDigits(str: string) {
  return (str || "").replace(/\D/g, "");
}

export async function fetchViaCep(cep: string): Promise<ViaCep> {
  const clean = onlyDigits(cep);
  if (clean.length !== 8) throw new Error("CEP inválido");
  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao consultar CEP");
  const data = (await res.json()) as ViaCep;
  if ((data as any).erro) throw new Error("CEP não encontrado");
  return data;
}
