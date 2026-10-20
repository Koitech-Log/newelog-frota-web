import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login, type LoginResponse } from "../api/auth";
import {
  lerSessao,
  limparSessao,
  registrarAoExpirar,
  salvarSessao,
} from "../api/session";

interface AuthContextValue {
  sessao: LoginResponse | null;
  /** Mensagem para a tela de login quando a sessão acabou sem o usuário pedir. */
  aviso: string | null;
  signIn: (email: string, senha: string, lembrar: boolean) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<LoginResponse | null>(lerSessao);
  const [aviso, setAviso] = useState<string | null>(null);

  const signIn = useCallback(async (email: string, senha: string, lembrar: boolean) => {
    const dados = await login(email.trim(), senha);
    salvarSessao(dados, lembrar); // grava antes de renderizar a área logada, que já faz chamadas
    setAviso(null);
    setSessao(dados);
  }, []);

  const signOut = useCallback(() => {
    limparSessao();
    setSessao(null);
  }, []);

  const expirar = useCallback(() => {
    limparSessao();
    setAviso("Sua sessão expirou. Entre novamente.");
    setSessao(null);
  }, []);

  // Um serviço respondeu 401 (token vencido ou inválido).
  useEffect(() => {
    registrarAoExpirar(expirar);
    return () => registrarAoExpirar(null);
  }, [expirar]);

  // Volta ao login na hora em que o token vence, sem esperar a próxima chamada.
  useEffect(() => {
    if (!sessao) return;
    const restante = new Date(sessao.expiraEm).getTime() - Date.now();
    const timer = window.setTimeout(expirar, Math.max(0, restante));
    return () => window.clearTimeout(timer);
  }, [sessao, expirar]);

  const value = useMemo(
    () => ({ sessao, aviso, signIn, signOut }),
    [sessao, aviso, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de um AuthProvider.");
  }
  return context;
}
