import { useState } from "react";
import { manifestoApi } from "../api/manifesto";
import { ApiRequestError } from "../api/client";
import type { ManifestoUploadResponse } from "../types/manifesto";

type EstadoImportacao = "idle" | "carregando" | "sucesso" | "atencao" | "erro";

interface EstadoImportarManifesto {
  estado: EstadoImportacao;
  resultado: ManifestoUploadResponse | null;
  mensagemErro: string | null;
}

const ESTADO_INICIAL: EstadoImportarManifesto = {
  estado: "idle",
  resultado: null,
  mensagemErro: null,
};

export function useImportarManifesto() {
  const [dados, setDados] = useState<EstadoImportarManifesto>(ESTADO_INICIAL);

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
      const resultado = await manifestoApi.importarCsv(arquivo);
      setDados({
        estado: resultado.novos.length > 0 ? "atencao" : "sucesso",
        resultado,
        mensagemErro: null,
      });
    } catch (erro) {
      const mensagem =
        erro instanceof ApiRequestError
          ? erro.message
          : "Não foi possível conectar ao manifesto-service. Ele está rodando em localhost:8081?";
      setDados({ estado: "erro", resultado: null, mensagemErro: mensagem });
    }
  }

  function reiniciar() {
    setDados(ESTADO_INICIAL);
  }

  return { ...dados, importar, reiniciar };
}
