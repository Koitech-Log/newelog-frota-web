import { createContext, useContext, useState, type ReactNode } from "react";

export type Perfil = "gestor" | "operador";

interface ProfileContextValue {
  perfil: Perfil;
  setPerfil: (perfil: Perfil) => void;
  /** true quando o perfil ativo pode ver valores financeiros (frete, pedágio, rentabilidade). */
  podeVerFinanceiro: boolean;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * Replica, em React, a regra que no protótipo HTML era feita via
 * `body.profile-gestor` + CSS `display:none` — aqui a ocultação é por
 * renderização condicional (mais idiomático em React que toggle de classe),
 * mas o efeito visual final é o mesmo: Operador não vê frete, pedágio,
 * rentabilidade nem "Rentab. / viagem".
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil>("gestor");

  return (
    <ProfileContext.Provider
      value={{ perfil, setPerfil, podeVerFinanceiro: perfil === "gestor" }}
    >
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
