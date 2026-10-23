import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ImportManifestoContextValue {
  /** Incrementa a cada importação concluída — gatilho para recarregar listas e totais. */
  versaoImportacao: number;
  /** Avisa que uma importação (manifesto ou veículos) terminou. */
  registrarImportacao: () => void;
}

const ImportManifestoContext = createContext<ImportManifestoContextValue | null>(null);

/**
 * Guarda a "versão" das importações de CSV para que as telas (Motoristas,
 * Dashboard) e os totais do menu recarreguem quando uma importação termina.
 * Os modais de importação ficam no ImportCsvContext.
 */
export function ImportManifestoProvider({ children }: { children: ReactNode }) {
  const [versaoImportacao, setVersaoImportacao] = useState(0);
  const registrarImportacao = useCallback(() => setVersaoImportacao((v) => v + 1), []);

  const value = useMemo(
    () => ({ versaoImportacao, registrarImportacao }),
    [versaoImportacao, registrarImportacao]
  );

  return <ImportManifestoContext.Provider value={value}>{children}</ImportManifestoContext.Provider>;
}

export function useImportManifesto(): ImportManifestoContextValue {
  const context = useContext(ImportManifestoContext);
  if (!context) {
    throw new Error("useImportManifesto precisa ser usado dentro de um ImportManifestoProvider.");
  }
  return context;
}
