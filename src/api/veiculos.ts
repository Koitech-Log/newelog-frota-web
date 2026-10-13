import { ApiRequestError } from "./client";
import type { VeiculoUploadResponse } from "../types/veiculo";
import type { ApiErro } from "../types/motorista";

const VEICULOS_SERVICE_URL =
    import.meta.env.VITE_VEICULOS_SERVICE_URL ?? "http://localhost:8081";

export const veiculosApi = {
    async importarCsv(arquivo: File): Promise<VeiculoUploadResponse> {
        const formData = new FormData();
        formData.append("file", arquivo);

        const response = await fetch(`${VEICULOS_SERVICE_URL}/veiculos/upload`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            let mensagem = `Erro ${response.status} ao importar os veículos`;
            try {
                const corpo = (await response.json()) as ApiErro;
                if (corpo.mensagem) mensagem = corpo.mensagem;
            } catch {
            }
            throw new ApiRequestError(response.status, mensagem);
        }

        return (await response.json()) as VeiculoUploadResponse;
    },
};