/**
 * Dados simulados do ranking, usados só em desenvolvimento (VITE_RANKING_MOCK=1)
 * enquanto o ranking-service não está disponível. Segue o `contrato-api`:
 * ordem por resultado ↓, viagens ↓, nome/placa, ID; posição definida ANTES da busca.
 *
 * Atalhos para exercitar os estados da tela:
 *  - janeiro de qualquer ano: mês sem viagens;
 *  - busca "!400", "!403", "!502" ou "!503": o erro HTTP correspondente;
 *  - busca "!rede": falha de conexão.
 */
import { ApiRequestError } from "./client";
import type { ConsultaRanking, RankingItem, RankingResponse } from "./ranking";

interface MotoristaMock {
  id: number;
  nome: string;
  cpf: string;
  placa: string | null;
  viagens: number;
  frete: number;
  pedagio: number;
}

const BASE: MotoristaMock[] = [
  { id: 1, nome: "Ana Sá", cpf: "11111111111", placa: "ABC1D23", viagens: 12, frete: 18400, pedagio: 1320.5 },
  { id: 2, nome: "Bruno Almeida", cpf: "22222222222", placa: "DEF2E34", viagens: 9, frete: 15250, pedagio: 980 },
  { id: 3, nome: "Carla Nunes", cpf: "33333333333", placa: "GHI3F45", viagens: 14, frete: 15250, pedagio: 980 },
  { id: 4, nome: "João Pereira", cpf: "44444444444", placa: "JKL4G56", viagens: 7, frete: 9800, pedagio: 640.75 },
  { id: 5, nome: "Érica Lima", cpf: "55555555555", placa: "JKL4G56", viagens: 5, frete: 7200, pedagio: 410 },
  { id: 6, nome: "Marcos Vinícius Teixeira de Albuquerque", cpf: "66666666666", placa: null, viagens: 3, frete: 4100, pedagio: 390 },
  { id: 7, nome: "Paula Souza", cpf: "77777777777", placa: "MNO5H67", viagens: 2, frete: 900, pedagio: 1250.4 },
  { id: 8, nome: "Rafael Costa", cpf: "88888888888", placa: "PQR6I78", viagens: 6, frete: 8300, pedagio: 512.3 },
];

function normalizar(texto: string | null) {
  return (texto ?? "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function esperar(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const id = window.setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      window.clearTimeout(id);
      reject(new DOMException("Requisição cancelada", "AbortError"));
    });
  });
}

interface Grupo {
  id: number | null;
  nome: string | null;
  placa: string | null;
  viagens: number;
  frete: number;
  pedagio: number;
  /** Nomes e CPFs que levam a este item na busca. */
  nomes: string[];
  cpfs: string[];
}

function agrupar(consulta: ConsultaRanking): Grupo[] {
  if (consulta.mes === 1) return [];

  // varia os valores por período para a troca de mês ser visível
  const fator = 1 + ((consulta.ano * 12 + consulta.mes) % 5) * 0.07;
  const motoristas = BASE.map((m) => ({ ...m, frete: Math.round(m.frete * fator * 100) / 100 }));

  if (consulta.tipo === "motoristas") {
    return motoristas.map((m) => ({
      id: m.id,
      nome: m.nome,
      placa: m.placa,
      viagens: m.viagens,
      frete: m.frete,
      pedagio: m.pedagio,
      nomes: [m.nome],
      cpfs: [m.cpf],
    }));
  }

  const porPlaca = new Map<string, Grupo>();
  for (const m of motoristas) {
    if (!m.placa) continue;
    const grupo = porPlaca.get(m.placa) ?? {
      id: null,
      nome: null,
      placa: m.placa,
      viagens: 0,
      frete: 0,
      pedagio: 0,
      nomes: [],
      cpfs: [],
    };
    grupo.viagens += m.viagens;
    grupo.frete += m.frete;
    grupo.pedagio += m.pedagio;
    grupo.nomes.push(m.nome);
    grupo.cpfs.push(m.cpf);
    porPlaca.set(m.placa, grupo);
  }
  return [...porPlaca.values()];
}

export async function buscarRankingMock(
  consulta: ConsultaRanking,
  signal?: AbortSignal,
): Promise<RankingResponse> {
  await esperar(700, signal);

  const busca = consulta.busca.trim();
  if (busca === "!rede") throw new TypeError("Failed to fetch");
  if (busca === "!400") throw new ApiRequestError(400, "A busca deve ter no máximo 150 caracteres.");
  if (busca === "!403") throw new ApiRequestError(403, "Você não tem permissão para acessar o ranking.");
  if (busca === "!502") throw new ApiRequestError(502, "Resposta inválida do serviço de motoristas.");
  if (busca === "!503") throw new ApiRequestError(503, "Serviço de motoristas indisponível.");

  const resultado = (g: Grupo) => Math.round((g.frete - g.pedagio) * 100) / 100;
  const ordenados = agrupar(consulta).sort(
    (a, b) =>
      resultado(b) - resultado(a) ||
      b.viagens - a.viagens ||
      normalizar(a.nome ?? a.placa).localeCompare(normalizar(b.nome ?? b.placa)) ||
      (a.id ?? 0) - (b.id ?? 0),
  );

  const itens: (RankingItem & { grupo: Grupo })[] = ordenados.map((g, i) => ({
    posicao: i + 1,
    motoristaId: g.id,
    motorista: g.nome,
    veiculo: g.placa,
    quantidadeViagens: g.viagens,
    freteTotal: Math.round(g.frete * 100) / 100,
    custoTotal: Math.round(g.pedagio * 100) / 100,
    resultado: resultado(g),
    distanciaKm: null,
    destinos: ["São Paulo"],
    grupo: g,
  }));

  const termo = normalizar(busca);
  const termoPlaca = termo.replace(/-/g, "");
  const digitos = /^[0-9. /-]+$/.test(busca) ? busca.replace(/\D/g, "") : "";
  const filtrados = !termo
    ? itens
    : itens.filter(
        ({ grupo }) =>
          grupo.nomes.some((nome) => normalizar(nome).includes(termo)) ||
          (!!termoPlaca && normalizar(grupo.placa).includes(termoPlaca)) ||
          (!!digitos && grupo.cpfs.some((cpf) => cpf.includes(digitos))),
      );

  return {
    ano: consulta.ano,
    mes: consulta.mes,
    tipo: consulta.tipo,
    criterioOrdenacao: "RESULTADO_FINANCEIRO",
    totalParticipantes: itens.length,
    dados: filtrados.map(({ grupo: _grupo, ...item }) => item),
  };
}
