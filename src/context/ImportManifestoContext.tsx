import { createContext, useContext, useState, type ReactNode } from "react";
import { ImportManifestoModal } from "../components/ImportManifesto";

interface ImportManifestoContextValue {
  abrirModal: () => void;
  /** Incrementa a cada importação concluída — usado como gatilho para recarregar listas. */
  versaoImportacao: number;
}

const ImportManifestoContext = createContext<ImportManifestoContextValue | null>(null);

/**
 * Centraliza o estado do modal de importação de manifesto (CSV) num único
 * lugar, para que tanto a Sidebar (item "Importar CSV") quanto o botão de
 * importação da topbar mobile possam abri-lo sem prop-drilling — mesma
 * abordagem do ProfileContext para o seletor Gestor/Operador.
 */
export function ImportManifestoProvider({ children }: { children: ReactNode }) {
  const [modalAberto, setModalAberto] = useState(false);
  const [versaoImportacao, setVersaoImportacao] = useState(0);

  return (
    <ImportManifestoContext.Provider
      value={{ abrirModal: () => setModalAberto(true), versaoImportacao }}
    >
      {children}
      <ImportManifestoModal
        aberto={modalAberto}
        onClose={() => setModalAberto(false)}
        aoImportarComSucesso={() => setVersaoImportacao((v) => v + 1)}
      />
    </ImportManifestoContext.Provider>
  );
}

export function useImportManifesto(): ImportManifestoContextValue {
  const context = useContext(ImportManifestoContext);
  if (!context) {
    throw new Error("useImportManifesto precisa ser usado dentro de um ImportManifestoProvider.");
  }
  return context;
}
