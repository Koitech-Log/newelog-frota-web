import type { RentabilidadeMediaItem } from "../api/dashboard";
import type { MotoristaResumo, StatusMotorista } from "../types/motorista";

export const SEM_TIPO = "Não informado";
const CHAVE_SEM_TIPO = "__SEM_TIPO__";

/** "abc-1d23" e "ABC1D23" são o mesmo veículo. */
export function normalizarPlaca(placa: string | null | undefined): string {
  return placa ? placa.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

export interface MotoristaDoVeiculo {
  id: number;
  nome: string;
  status: StatusMotorista;
}

export interface VeiculoFrota {
  /** Placa normalizada, usada para cruzar com os dados do período. */
  chave: string;
  placa: string;
  tipoNome: string;
  motoristas: MotoristaDoVeiculo[];
}

export interface TipoFrota {
  chave: string;
  nome: string;
  motoristas: number;
  emOperacao: number;
  disponiveis: number;
  veiculos: VeiculoFrota[];
}

export interface ResumoFrota {
  totalMotoristas: number;
  motoristasSemVeiculo: number;
  emOperacao: number;
  disponiveis: number;
  veiculos: VeiculoFrota[];
  /** Tipos com nome informado (exclui o grupo "Não informado"). */
  quantidadeTipos: number;
  tipos: TipoFrota[];
}

/**
 * Deriva a frota a partir da lista de motoristas cadastrados — a mesma fonte
 * da tela de Motoristas e do menu lateral, para os números nunca divergirem.
 */
export function resumirFrota(
  motoristas: MotoristaResumo[],
  totalMotoristas = motoristas.length
): ResumoFrota {
  const tipos = new Map<string, TipoFrota>();
  const veiculosPorTipo = new Map<string, VeiculoFrota>();
  const veiculosGlobais = new Map<string, VeiculoFrota>();
  let semVeiculo = 0;
  let emOperacao = 0;
  let disponiveis = 0;

  for (const m of motoristas) {
    const nomeTipo = m.tipoVeiculo?.trim() || SEM_TIPO;
    const chaveTipo = m.tipoVeiculo?.trim() ? m.tipoVeiculo.trim().toUpperCase() : CHAVE_SEM_TIPO;

    let tipo = tipos.get(chaveTipo);
    if (!tipo) {
      tipo = { chave: chaveTipo, nome: nomeTipo, motoristas: 0, emOperacao: 0, disponiveis: 0, veiculos: [] };
      tipos.set(chaveTipo, tipo);
    }

    tipo.motoristas += 1;
    if (m.status === "EM_OPERACAO") {
      tipo.emOperacao += 1;
      emOperacao += 1;
    } else {
      tipo.disponiveis += 1;
      disponiveis += 1;
    }

    const chavePlaca = normalizarPlaca(m.placaVeiculo);
    if (!chavePlaca) {
      semVeiculo += 1;
      continue;
    }

    const motorista: MotoristaDoVeiculo = { id: m.id, nome: m.nome, status: m.status };
    const chaveComposta = `${chaveTipo}|${chavePlaca}`;
    const existente = veiculosPorTipo.get(chaveComposta);

    if (existente) {
      existente.motoristas.push(motorista);
    } else {
      const veiculo: VeiculoFrota = {
        chave: chavePlaca,
        placa: m.placaVeiculo!.trim().toUpperCase(),
        tipoNome: nomeTipo,
        motoristas: [motorista],
      };
      veiculosPorTipo.set(chaveComposta, veiculo);
      tipo.veiculos.push(veiculo);
      if (!veiculosGlobais.has(chavePlaca)) veiculosGlobais.set(chavePlaca, veiculo);
    }
  }

  const lista = [...tipos.values()].sort((a, b) => {
    if (a.chave === CHAVE_SEM_TIPO) return 1;
    if (b.chave === CHAVE_SEM_TIPO) return -1;
    return (
      b.veiculos.length - a.veiculos.length ||
      b.motoristas - a.motoristas ||
      a.nome.localeCompare(b.nome, "pt-BR")
    );
  });

  for (const tipo of lista) {
    tipo.veiculos.sort((a, b) => a.placa.localeCompare(b.placa, "pt-BR"));
  }

  return {
    totalMotoristas,
    motoristasSemVeiculo: semVeiculo,
    emOperacao,
    disponiveis,
    veiculos: [...veiculosGlobais.values()],
    quantidadeTipos: lista.filter((t) => t.chave !== CHAVE_SEM_TIPO).length,
    tipos: lista,
  };
}

// ---------------------------------------------------------------------------
// Cruzamento com o desempenho do período (dados do dashboard)
// ---------------------------------------------------------------------------

export interface DesempenhoPeriodo {
  viagens: number;
  frete: number;
  custo: number;
  rentabilidade: number;
  media: number;
  /** Veículos do grupo que fizeram ao menos uma viagem no período. */
  veiculosAtivos: number;
}

export function desempenhoPorPlaca(porVeiculo: RentabilidadeMediaItem[]) {
  const mapa = new Map<string, RentabilidadeMediaItem>();

  for (const item of porVeiculo) {
    if (item.id === null) continue; // "Sem veículo" não é uma placa
    mapa.set(normalizarPlaca(item.nome), item);
  }

  return mapa;
}

export function desempenhoDoTipo(
  veiculos: VeiculoFrota[],
  porPlaca: Map<string, RentabilidadeMediaItem>
): DesempenhoPeriodo {
  let viagens = 0;
  let frete = 0;
  let custo = 0;
  let rentabilidade = 0;
  let veiculosAtivos = 0;

  for (const veiculo of veiculos) {
    const item = porPlaca.get(veiculo.chave);
    if (!item || item.quantidadeViagens === 0) continue;

    viagens += item.quantidadeViagens;
    frete += item.freteTotal;
    custo += item.custoTotal;
    rentabilidade += item.rentabilidadeTotal;
    veiculosAtivos += 1;
  }

  return {
    viagens,
    frete,
    custo,
    rentabilidade,
    media: viagens > 0 ? rentabilidade / viagens : 0,
    veiculosAtivos,
  };
}

// ---------------------------------------------------------------------------
// Ranking completo: quem teve viagem + quem está cadastrado mas ficou parado
// ---------------------------------------------------------------------------

export interface ItemRanking extends RentabilidadeMediaItem {
  semViagens: boolean;
  detalhe: string | null;
}

const ZERO = {
  freteTotal: 0,
  custoTotal: 0,
  rentabilidadeTotal: 0,
  quantidadeViagens: 0,
  rentabilidadeMedia: 0,
};

function detalheMotorista(m: MotoristaResumo): string {
  return (
    [m.placaVeiculo?.trim(), m.tipoVeiculo?.trim()].filter(Boolean).join(" · ") || "Sem veículo"
  );
}

function detalheVeiculo(v: VeiculoFrota): string {
  const nomes = v.motoristas.map((m) => m.nome);
  const resumo =
    nomes.length > 2 ? `${nomes.slice(0, 2).join(", ")} +${nomes.length - 2}` : nomes.join(", ");

  return `${v.tipoNome} · ${resumo}`;
}

export function rankingMotoristas(
  porMotorista: RentabilidadeMediaItem[],
  cadastrados: MotoristaResumo[]
): ItemRanking[] {
  const porId = new Map(cadastrados.map((m) => [m.id, m]));
  const comViagem = new Set<number>();

  const base: ItemRanking[] = porMotorista.map((item) => {
    const cadastro = item.id !== null ? porId.get(item.id) : undefined;
    if (item.id !== null) comViagem.add(item.id);

    return { ...item, semViagens: false, detalhe: cadastro ? detalheMotorista(cadastro) : null };
  });

  const parados: ItemRanking[] = cadastrados
    .filter((m) => !comViagem.has(m.id))
    .map((m) => ({
      id: m.id,
      nome: m.nome,
      ...ZERO,
      semViagens: true,
      detalhe: detalheMotorista(m),
    }));

  return [...base, ...parados];
}

export function rankingVeiculos(
  porVeiculo: RentabilidadeMediaItem[],
  frota: ResumoFrota
): ItemRanking[] {
  const porChave = new Map(frota.veiculos.map((v) => [v.chave, v]));
  const comViagem = new Set<string>();

  const base: ItemRanking[] = porVeiculo.map((item) => {
    const chave = normalizarPlaca(item.nome);
    const veiculo = item.id !== null ? porChave.get(chave) : undefined;
    if (veiculo) comViagem.add(chave);

    return { ...item, semViagens: false, detalhe: veiculo ? detalheVeiculo(veiculo) : null };
  });

  const parados: ItemRanking[] = frota.veiculos
    .filter((v) => !comViagem.has(v.chave))
    .map((v) => ({
      id: null,
      nome: v.placa,
      ...ZERO,
      semViagens: true,
      detalhe: detalheVeiculo(v),
    }));

  return [...base, ...parados];
}
