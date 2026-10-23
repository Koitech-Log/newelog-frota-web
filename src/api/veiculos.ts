import { ApiRequestError } from "./client";
import type { VeiculoUploadResponse } from "../types/veiculo";
import type { ApiErro } from "../types/motorista";
import { lerToken, notificarSessaoExpirada } from "./session";

const MANIFESTO_SERVICE_URL =
    import.meta.env.VITE_MANIFESTO_SERVICE_URL ?? "http://localhost:8081";

export const veiculosApi = {
    async importarCsv(arquivo: File, signal?: AbortSignal): Promise<VeiculoUploadResponse> {
        const formData = new FormData();
        formData.append("file", arquivo);

        const token = lerToken();
        const response = await fetch(`${MANIFESTO_SERVICE_URL}/veiculos/upload`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: formData,
            signal,
        });

        if (!response.ok) {
            let mensagem = `Erro ${response.status} ao importar os veículos`;
            try {
                const corpo = (await response.json()) as ApiErro;
                if (corpo.mensagem) mensagem = corpo.mensagem;
            } catch {
            }
            if (response.status === 401) notificarSessaoExpirada();
            throw new ApiRequestError(response.status, mensagem);
        }

        return (await response.json()) as VeiculoUploadResponse;
    },
};

