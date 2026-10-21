import { createContext, useContext, useState, type ReactNode } from "react";
import { EscolhaImportacaoModal } from "../components/EscolhaImportacao";
import { ImportVeiculosModal } from "../components/ImportVeiculos";
import { useImportManifesto } from "./ImportManifestoContext";

interface ImportCsvContextValue {
    abrirEscolha: () => void;
}

const ImportCsvContext = createContext<ImportCsvContextValue | null>(null);

export function ImportCsvProvider({ children }: { children: ReactNode }) {
    const { abrirModal: abrirModalManifesto } = useImportManifesto();
    const [escolhaAberta, setEscolhaAberta] = useState(false);
    const [veiculosAberto, setVeiculosAberto] = useState(false);

    return (
        <ImportCsvContext.Provider value={{ abrirEscolha: () => setEscolhaAberta(true) }}>
            {children}
            <EscolhaImportacaoModal
                aberto={escolhaAberta}
                onClose={() => setEscolhaAberta(false)}
                onEscolherManifesto={() => {
                    setEscolhaAberta(false);
                    abrirModalManifesto();
                }}
                onEscolherVeiculos={() => {
                    setEscolhaAberta(false);
                    setVeiculosAberto(true);
                }}
            />
            <ImportVeiculosModal aberto={veiculosAberto} onClose={() => setVeiculosAberto(false)} />
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