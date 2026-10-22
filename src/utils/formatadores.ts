export const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const inteiro = new Intl.NumberFormat("pt-BR");
export const decimal1 = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export type FormatoNumero = "moeda" | "inteiro" | "percentual";

export function formatar(valor: number, formato: FormatoNumero): string {
  switch (formato) {
    case "moeda":
      return moeda.format(valor);
    case "inteiro":
      return inteiro.format(Math.round(valor));
    case "percentual":
      return `${decimal1.format(valor)}%`;
  }
}
