import { apiClient } from "./client";

export interface DashboardResponse {
  freteTotal: number;
  custoTotal: number;
  rentabilidadeTotal: number;
}

export interface RentabilidadeMediaGeral extends DashboardResponse {
  quantidadeViagens: number;
  rentabilidadeMedia: number;
}

export interface RentabilidadeMediaItem extends RentabilidadeMediaGeral {
  id: number | null;
  nome: string;
}

export interface RentabilidadeMediaResponse {
  ano: number;
  mes: number;
  geral: RentabilidadeMediaGeral;
  porMotorista: RentabilidadeMediaItem[];
  porVeiculo: RentabilidadeMediaItem[];
}

export function buscarRentabilidadeMedia(ano: number, mes: number) {
  return apiClient.get<RentabilidadeMediaResponse>(
    `/api/dashboard/rentabilidade-media?ano=${ano}&mes=${mes}`
  );
}

export function buscarDashboard(
  ano: number,
  mes: number
): Promise<DashboardResponse> {
  return apiClient.get<DashboardResponse>(
    `/api/dashboard?ano=${ano}&mes=${mes}`
  );
}
