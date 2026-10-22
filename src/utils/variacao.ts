import { decimal1 } from "./formatadores";

export type TomVariacao = "bom" | "ruim" | "neutro";

export interface Variacao {
  texto: string;
  tom: TomVariacao;
  direcao: "alta" | "queda" | "estavel";
}

interface Opcoes {
  /** Para indicadores em que subir é ruim (ex.: custos). */
  invertido?: boolean;
}

function montar(valor: number, sufixo: string, { invertido = false }: Opcoes): Variacao {
  const arredondado = Math.round(valor * 10) / 10;

  if (arredondado === 0) {
    return { texto: `0,0${sufixo}`, tom: "neutro", direcao: "estavel" };
  }

  const alta = arredondado > 0;
  const bom = invertido ? !alta : alta;

  return {
    texto: `${alta ? "+" : "−"}${decimal1.format(Math.abs(arredondado))}${sufixo}`,
    tom: bom ? "bom" : "ruim",
    direcao: alta ? "alta" : "queda",
  };
}

/** Variação percentual entre dois períodos. Retorna null quando não há base de comparação. */
export function variacaoPercentual(
  atual: number,
  anterior: number | null | undefined,
  opcoes: Opcoes = {}
): Variacao | null {
  if (anterior == null || !Number.isFinite(anterior)) return null;
  if (anterior === 0) return atual === 0 ? montar(0, "%", opcoes) : null;

  return montar(((atual - anterior) / Math.abs(anterior)) * 100, "%", opcoes);
}

/** Diferença em pontos percentuais (para indicadores que já são porcentagem). */
export function variacaoPontos(
  atual: number,
  anterior: number | null | undefined,
  opcoes: Opcoes = {}
): Variacao | null {
  if (anterior == null || !Number.isFinite(anterior)) return null;

  return montar(atual - anterior, " p.p.", opcoes);
}
