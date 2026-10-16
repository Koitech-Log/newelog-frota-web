import { useState } from "react";
import { veiculosApi } from "../api/veiculos";
import { ApiRequestError } from "../api/client";
import type { VeiculoUploadResponse } from "../types/veiculo";

type EstadoImportacao = "idle" | "carregando" | "sucesso" | "atencao" | "erro";

interface EstadoImportarVeiculos {
    estado: EstadoImportacao;
    resultado: VeiculoUploadResponse | null;
    mensagemErro: string | null;
}

const ESTADO_INICIAL: EstadoImportarVeiculos = {
    estado: "idle",
    resultado: null,
    mensagemErro: null,
};

export function useImportarVeiculos() {
    const [dados, setDados] = useState<EstadoImportarVeiculos>(ESTADO_INICIAL);

    async function importar(arquivo: File) {
        if (!arquivo.name.toLowerCase().endsWith(".csv")) {
            setDados({
                estado: "erro",
                resultado: null,
                mensagemErro: "Arquivo inválido — envie um .csv.",
            });
            return;
        }

        setDados({ estado: "carregando", resultado: null, mensagemErro: null });

        try {
            const resultado = await veiculosApi.importarCsv(arquivo);
            setDados({
                estado: resultado.rejeitados > 0 ? "atencao" : "sucesso",
                resultado,
                mensagemErro: null,
            });
        } catch (erro) {
            const mensagem =
                erro instanceof ApiRequestError
                    ? erro.message
                    : "Não foi possível conectar ao serviço de veículos. Ele está rodando?";
            setDados({ estado: "erro", resultado: null, mensagemErro: mensagem });
        }
    }

    function reiniciar() {
        setDados(ESTADO_INICIAL);
    }

    return { ...dados, importar, reiniciar };
}