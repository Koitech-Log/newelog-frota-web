import type { ApiErro } from "../types/motorista";

// Em produção isso viria de uma variável de ambiente (VITE_API_BASE_URL) apontando
// para o gateway; por ora, sem gateway pronto, aponta direto para o motoristas-service.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    let mensagem = `Erro ${response.status} ao chamar ${path}`;
    try {
      const corpo = (await response.json()) as ApiErro;
      if (corpo.mensagem) mensagem = corpo.mensagem;
    } catch {
      // corpo de erro não veio em JSON — mantém a mensagem genérica
    }
    throw new ApiRequestError(response.status, mensagem);
  }

  // PATCH/DELETE podem responder 204 sem corpo
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};
