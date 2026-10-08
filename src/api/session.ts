import type { LoginResponse } from "./auth";

const CHAVE = "newelog.session";

/**
 * Lê a sessão salva ("Manter conectado" usa localStorage; senão, sessionStorage).
 * Sessões já vencidas são descartadas aqui mesmo.
 */
export function lerSessao(): LoginResponse | null {
  try {
    const bruto = localStorage.getItem(CHAVE) ?? sessionStorage.getItem(CHAVE);
    if (!bruto) return null;
    const sessao = JSON.parse(bruto) as LoginResponse;
    if (new Date(sessao.expiraEm).getTime() <= Date.now()) {
      limparSessao();
      return null;
    }
    return sessao;
  } catch {
    return null;
  }
}

export function salvarSessao(sessao: LoginResponse, lembrar: boolean): void {
  limparSessao();
  (lembrar ? localStorage : sessionStorage).setItem(CHAVE, JSON.stringify(sessao));
}

export function limparSessao(): void {
  localStorage.removeItem(CHAVE);
  sessionStorage.removeItem(CHAVE);
}

export function lerToken(): string | null {
  return lerSessao()?.token ?? null;
}

// Os clientes HTTP (client.ts, manifesto.ts) avisam o AuthContext quando um
// serviço responde 401, para a aplicação voltar ao login.
let aoExpirar: (() => void) | null = null;

export function registrarAoExpirar(fn: (() => void) | null): void {
  aoExpirar = fn;
}

export function notificarSessaoExpirada(): void {
  aoExpirar?.();
}
