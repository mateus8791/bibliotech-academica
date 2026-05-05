export type Address = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  localidade: string; // cidade
  uf: string;
};
