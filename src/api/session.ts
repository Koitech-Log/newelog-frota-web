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

export function atualizarSessao(sessao: LoginResponse): void {
  const storage = localStorage.getItem(CHAVE) !== null ? localStorage : sessionStorage;
  storage.setItem(CHAVE, JSON.stringify(sessao));
}

export function lerToken(): string | null {
  return lerSessao()?.token ?? null;
}

/**
 * Id do usuário logado (claim "sub" do JWT). Usado só para a interface (ex.: não
 * oferecer "desativar" no próprio usuário) — quem decide é sempre o back-end.
 */
export function lerIdUsuario(): number | null {
  const token = lerToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(payload)) as { sub?: string };
    const id = Number(claims.sub);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
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
