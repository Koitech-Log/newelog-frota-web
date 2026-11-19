import { rankingApiClient } from "./client";

export type TipoRanking = "motoristas" | "veiculos";

export interface RankingItem {
  /** Posição real no ranking completo do mês, definida antes da busca. */
  posicao: number;
  /** Nulo na visão de veículos. */
  motoristaId: number | null;
  /** Nulo na visão de veículos. */
  motorista: string | null;
  /** Placa; pode ser nula na visão de motoristas (motorista sem placa). */
  veiculo: string | null;
  quantidadeViagens: number;
  freteTotal: number;
  custoTotal: number;
  /** Frete − pedágios: a "rentabilidade" exibida na tela. Pode ser negativo. */
  resultado: number;
  distanciaKm: number | null;
  destinos: string[];
  /**
   * Pontuação mensal usada para ordenar o ranking: soma da rentabilidade das
   * viagens que contam no mês, já com a valorização por destino aplicada.
   */
  pontuacao: number;
}

export interface RankingResponse {
  ano: number;
  mes: number;
  tipo: TipoRanking;
  criterioOrdenacao: string;
  /** Participantes do mês/tipo antes da busca. Ausente em versões antigas do serviço. */
  totalParticipantes?: number;
  dados: RankingItem[];
}

export interface ConsultaRanking {
  ano: number;
  mes: number;
  tipo: TipoRanking;
  /** Nome, CPF ou placa. Vazio = sem filtro. */
  busca: string;
}

const USAR_MOCK = import.meta.env.DEV && import.meta.env.VITE_RANKING_MOCK === "1";

/** GET /ranking do ranking-service. A ordem e as posições vêm prontas do serviço. */
export async function buscarRanking(
  consulta: ConsultaRanking,
  signal?: AbortSignal,
): Promise<RankingResponse> {
  if (USAR_MOCK) {
    const { buscarRankingMock } = await import("./ranking.mock");
    return buscarRankingMock(consulta, signal);
  }

  const params = new URLSearchParams({
    ano: String(consulta.ano),
    mes: String(consulta.mes),
    tipo: consulta.tipo,
  });
  const busca = consulta.busca.trim();
  if (busca) params.set("busca", busca);

  return rankingApiClient.get<RankingResponse>(`/ranking?${params.toString()}`, signal);
}
