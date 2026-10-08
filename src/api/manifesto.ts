import { ApiRequestError } from "./client";
import type { ManifestoUploadResponse } from "../types/manifesto";
import type { ApiErro } from "../types/motorista";
import { lerToken, notificarSessaoExpirada } from "./session";

// Serviço separado do motoristas-service, em outra porta — ver README do
// manifesto-service. Sem gateway ainda, cada serviço tem sua própria URL
// configurável via variável de ambiente.
const MANIFESTO_SERVICE_URL =
  import.meta.env.VITE_MANIFESTO_SERVICE_URL ?? "http://localhost:8081";

export const manifestoApi = {
  async importarCsv(arquivo: File): Promise<ManifestoUploadResponse> {
    const formData = new FormData();
    formData.append("file", arquivo);

    // Sem Content-Type: o navegador define o boundary do multipart.
    const token = lerToken();
    const response = await fetch(`${MANIFESTO_SERVICE_URL}/manifestos/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!response.ok) {
      let mensagem = `Erro ${response.status} ao importar o manifesto`;
      try {
        const corpo = (await response.json()) as ApiErro;
        if (corpo.mensagem) mensagem = corpo.mensagem;
      } catch {
        // corpo de erro não veio em JSON — mantém a mensagem genérica
      }
      if (response.status === 401) notificarSessaoExpirada();
      throw new ApiRequestError(response.status, mensagem);
    }

    return (await response.json()) as ManifestoUploadResponse;
  },
};
