import { apiClient } from "./client";

export interface DashboardResponse {
  freteTotal: number;
  custoTotal: number;
  rentabilidadeTotal: number;
}

export function buscarDashboard(
  ano: number,
  mes: number
): Promise<DashboardResponse> {
  return apiClient.get<DashboardResponse>(
    `/api/dashboard?ano=${ano}&mes=${mes}`
  );
}