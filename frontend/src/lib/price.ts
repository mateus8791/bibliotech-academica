export function discountPercent(preco: number, promocional?: number) {
  if (!promocional || promocional >= preco) return 0;
  return Math.round((1 - promocional / preco) * 100);
}
export function parcelas(precoFinal: number, qtd = 3) {
  const valor = precoFinal / qtd;
  return { qtd, valor };
}
