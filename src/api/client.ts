import type { ApiErro } from "../types/motorista";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let mensagem = `Erro ${response.status} ao chamar ${path}`;

    try {
      const corpo = (await response.json()) as ApiErro;

      if (corpo.mensagem) {
        mensagem = corpo.mensagem;
      }
    } catch {
      // mantém a mensagem genérica
    }

    throw new ApiRequestError(response.status, mensagem);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) =>
    request<T>(path, {
      method: "GET",
    }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
