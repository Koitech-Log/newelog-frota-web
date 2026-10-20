import { createContext, useContext, type ReactNode } from "react";

export type Perfil = "gestor" | "operador";

interface ProfileContextValue {
  perfil: Perfil;
  /** true quando o perfil ativo pode ver valores financeiros (frete, pedágio, rentabilidade). */
  podeVerFinanceiro: boolean;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * O perfil vem do token emitido pelo auth-service (não é mais escolhido na
 * Sidebar). Operador não vê frete, pedágio, rentabilidade nem "Rentab. / viagem".
 *
 * Atenção: esta é uma regra de exibição. Os serviços ainda devolvem os valores
 * financeiros para qualquer usuário autenticado.
 */
export function ProfileProvider({ perfil, children }: { perfil: Perfil; children: ReactNode }) {
  return (
    <ProfileContext.Provider value={{ perfil, podeVerFinanceiro: perfil === "gestor" }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile precisa ser usado dentro de um ProfileProvider.");
  }
  return context;
}
