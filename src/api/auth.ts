import type { Perfil } from "../context/ProfileContext";
import { lerToken, notificarSessaoExpirada } from "./session";  

// newelog-auth-service (POST /api/auth/login). Contrato no README daquele serviço.
export const AUTH_SERVICE_URL =
  import.meta.env.VITE_AUTH_SERVICE_URL ?? "http://localhost:8082";

export interface LoginResponse {
  token: string;
  tipo: string;
  expiraEm: string;
  nome: string;
  perfil: Perfil;
  mustChangePassword: boolean;
}

export class AuthError extends Error {
  status?: number;

  constructor(mensagem: string, status?: number) {
    super(mensagem);
    this.name = "AuthError";
    this.status = status;
  }
}

async function LerMensagemErro(response: Response): Promise<string> {
  
  let mensagem = "Erro no servidor. Tente novamente em instantes.";
  try{
    const corpo = (await response.json()) as { mensagem?: string };
    if (corpo.mensagem) mensagem = corpo.mensagem;
  } catch {
    //corpo fora de JSON: mantém a mensagem genérica
  }
  return mensagem
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
    throw new AuthError(await LerMensagemErro(response), response.status);
  }

  return (await response.json()) as LoginResponse;
}

/** POST /api/auth/alterar-senha (204 em caso de sucesso). Usa o token da sessão atual. */
export async function alterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
  const token = lerToken();
  let response: Response;
  try {
    response = await fetch(`${AUTH_SERVICE_URL}/api/auth/alterar-senha`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    });
  } catch {
    throw new AuthError("Não foi possível conectar ao servidor. Verifique sua conexão.");
  }

  if (response.ok) return;

  // Aqui 401 é sessão vencida (senha atual errada volta como 400).
  if (response.status === 401) notificarSessaoExpirada();
  throw new AuthError(await LerMensagemErro(response), response.status);
}
