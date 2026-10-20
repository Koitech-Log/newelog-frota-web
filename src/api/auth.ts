import type { Perfil } from "../context/ProfileContext";

// newelog-auth-service (POST /api/auth/login). Contrato no README daquele serviço.
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL ?? "http://localhost:8082";

export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEm: string;
  nome: string;
  perfil: Perfil;
}

export class AuthError extends Error {
  status?: number;

  constructor(mensagem: string, status?: number) {
    super(mensagem);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
  } catch {
    throw new AuthError("Não foi possível conectar ao servidor. Verifique sua conexão.");
  }

  if (!response.ok) {
    // O serviço sempre devolve { timestamp, mensagem }, igual aos demais.
    let mensagem = "Erro no servidor. Tente novamente em instantes.";
    try {
      const corpo = (await response.json()) as { mensagem?: string };
      if (corpo.mensagem) mensagem = corpo.mensagem;
    } catch {
      // corpo fora de JSON: mantém a mensagem genérica
    }
    throw new AuthError(mensagem, response.status);
  }

  return (await response.json()) as LoginResponse;
}
