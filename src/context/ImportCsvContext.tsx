import { createContext, useContext, useState, type ReactNode } from "react";
import { ImportCsvModal } from "../components/ImportCsv";
import type { TipoImportacao } from "../components/SeletorImportacao";
import { useImportManifesto } from "./ImportManifestoContext";

interface ImportCsvContextValue {
  /** Abre o modal de importação de CSV; por padrão, abre em Manifesto. */
  abrirImportacao: (tipo?: TipoImportacao) => void;
}

const ImportCsvContext = createContext<ImportCsvContextValue | null>(null);

/**
 * Mantém um único modal para importar manifestos e veículos.
 * O callback de sincronização do contexto de manifesto é acionado após
 * a conclusão e o fechamento do modal, conforme o tipo importado.
 */
export function ImportCsvProvider({ children }: { children: ReactNode }) {
  const { registrarImportacao } = useImportManifesto();
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoImportacao>("manifesto");

  function abrirImportacao(tipoInicial: TipoImportacao = "manifesto") {
    setTipo(tipoInicial);
    setAberto(true);
  }

  function fecharImportacao() {
    setAberto(false);
  }

  return (
    <ImportCsvContext.Provider value={{ abrirImportacao }}>
      {children}
      <ImportCsvModal
        aberto={aberto}
        tipo={tipo}
        onTrocarTipo={setTipo}
        onClose={fecharImportacao}
        aoImportarManifesto={registrarImportacao}
        aoImportarVeiculos={registrarImportacao}
      />
    </ImportCsvContext.Provider>
  );
}

export function useImportCsv(): ImportCsvContextValue {
  const context = useContext(ImportCsvContext);

  if (!context) {
    throw new Error("useImportCsv precisa ser usado dentro de um ImportCsvProvider.");
  }

  return context;
}
