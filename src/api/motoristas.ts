import { apiClient } from "./client";
import type {
  MotoristaDetalhe,
  MotoristaResumo,
  Pagina,
  StatusMotorista,
} from "../types/motorista";

export interface FiltrosMotorista {
  status?: StatusMotorista;
  destino?: string;
  busca?: string;
  page?: number;
  size?: number;
}

const TAMANHO_PAGINA_PADRAO = 12;

function paraQueryString(filtros: FiltrosMotorista): string {
  const params = new URLSearchParams();
  if (filtros.status) params.set("status", filtros.status);
  if (filtros.destino) params.set("destino", filtros.destino);
  if (filtros.busca) params.set("busca", filtros.busca);
  params.set("page", String(filtros.page ?? 0));
  params.set("size", String(filtros.size ?? TAMANHO_PAGINA_PADRAO));
  return `?${params.toString()}`;
}

export const motoristasApi = {
  listar: (filtros: FiltrosMotorista = {}) =>
    apiClient.get<Pagina<MotoristaResumo>>(`/api/motoristas${paraQueryString(filtros)}`),

  buscarDetalhe: (id: number) =>
    apiClient.get<MotoristaDetalhe>(`/api/motoristas/${id}`),

  atualizarStatus: (id: number, status: StatusMotorista) =>
    apiClient.patch<MotoristaDetalhe>(`/api/motoristas/${id}/status`, { status }),
};
