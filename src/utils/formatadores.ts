export const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const inteiro = new Intl.NumberFormat("pt-BR");
export const decimal1 = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const decimal2 = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export type FormatoNumero = "moeda" | "inteiro" | "percentual" | "pontos";

export function formatar(valor: number, formato: FormatoNumero): string {
  switch (formato) {
    case "moeda":
      return moeda.format(valor);
    case "inteiro":
      return inteiro.format(Math.round(valor));
    case "percentual":
      return `${decimal1.format(valor)}%`;
    case "pontos":
      return decimal2.format(valor);
  }
}

/** Até duas iniciais de um nome, para o avatar (ex.: "Ana Sá" → "AS"). */
export function iniciais(nome: string | null | undefined): string {
  const partes = (nome ?? "")
    .trim()
    .split(/\s+/)
    .filter((parte) => /\p{L}/u.test(parte));
  if (partes.length === 0) return "?";
  const primeira = Array.from(partes[0])[0];
  const ultima = partes.length > 1 ? Array.from(partes[partes.length - 1])[0] : "";
  return (primeira + ultima).toLocaleUpperCase("pt-BR");
}
