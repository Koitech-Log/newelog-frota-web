import { createContext, useContext, useState, type ReactNode } from "react";
import { ImportCsvModal } from "../components/ImportCsv";
import type { TipoImportacao } from "../components/SeletorImportacao";
import { useImportManifesto } from "./ImportManifestoContext";

interface ImportCsvContextValue {
    /** Abre o modal de importação de CSV (por padrão no tipo Manifesto). */
    abrirImportacao: (tipo?: TipoImportacao) => void;
}

const ImportCsvContext = createContext<ImportCsvContextValue | null>(null);

/**
 * Controla o modal único de importação de CSV. O tipo (manifesto/veículos)
 * é escolhido pelo seletor dentro do próprio modal.
 */
export function ImportCsvProvider({ children }: { children: ReactNode }) {
    const { registrarImportacao } = useImportManifesto();
    const [aberto, setAberto] = useState(false);
    const [tipo, setTipo] = useState<TipoImportacao>("manifesto");

    function abrirImportacao(tipoInicial: TipoImportacao = "manifesto") {
        setTipo(tipoInicial);
        setAberto(true);
    }

    return (
        <ImportCsvContext.Provider value={{ abrirImportacao }}>
            {children}
            <ImportCsvModal
                aberto={aberto}
                tipo={tipo}
                onTrocarTipo={setTipo}
                onClose={() => setAberto(false)}
                aoImportar={registrarImportacao}
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
