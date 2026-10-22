import { createContext, useContext, useState, type ReactNode } from "react";

interface ImportManifestoContextValue {
  /** Incrementa a cada importação concluída — usado como gatilho para recarregar listas. */
  versaoImportacao: number;
  /** Avisa que uma importação de manifesto terminou (dispara o recarregamento das listas). */
  registrarImportacao: () => void;
}

const ImportManifestoContext = createContext<ImportManifestoContextValue | null>(null);

/**
 * Guarda a "versão" das importações de manifesto para que as páginas
 * (Motoristas, Dashboard) recarreguem suas listas quando uma importação
 * termina. Os modais de importação ficam no ImportCsvContext, que decide
 * qual deles está aberto.
 */
export function ImportManifestoProvider({ children }: { children: ReactNode }) {
  const [versaoImportacao, setVersaoImportacao] = useState(0);

  return (
    <ImportManifestoContext.Provider
      value={{
        versaoImportacao,
        registrarImportacao: () => setVersaoImportacao((v) => v + 1),
      }}
    >
      {children}
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
