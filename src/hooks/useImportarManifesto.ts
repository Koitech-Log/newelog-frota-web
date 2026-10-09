import { useCallback, useEffect, useRef, useState } from "react";
import { manifestoApi } from "../api/manifesto";
import { ApiRequestError } from "../api/client";
import type { ManifestoUploadResponse } from "../types/manifesto";

export type EstadoImportacao =
  | "idle" // nenhum arquivo escolhido
  | "selecionado" // arquivo válido, aguardando confirmação
  | "carregando"
  | "sucesso"
  | "atencao" // importou, mas há motoristas novos a validar
  | "erro";

/** Limite de tamanho aceito no front-end, para falhar rápido antes do upload. */
export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;

interface EstadoHook {
  estado: EstadoImportacao;
  arquivo: File | null;
  resultado: ManifestoUploadResponse | null;
  mensagemErro: string | null;
}

const ESTADO_INICIAL: EstadoHook = {
  estado: "idle",
  arquivo: null,
  resultado: null,
  mensagemErro: null,
};

function validarArquivo(arquivo: File): string | null {
  if (!arquivo.name.toLowerCase().endsWith(".csv")) {
    return "Formato inválido. Envie um arquivo com extensão .csv.";
  }
  if (arquivo.size === 0) {
    return "O arquivo está vazio.";
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return `O arquivo excede o limite de ${TAMANHO_MAXIMO_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

export function useImportarManifesto() {
  const [dados, setDados] = useState<EstadoHook>(ESTADO_INICIAL);
  const controllerRef = useRef<AbortController | null>(null);

  // Cancela qualquer upload em andamento se o componente for desmontado.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const selecionar = useCallback((arquivo: File | undefined) => {
    if (!arquivo) return;
    const erro = validarArquivo(arquivo);
    if (erro) {
      setDados({ estado: "erro", arquivo: null, resultado: null, mensagemErro: erro });
      return;
    }
    setDados({ estado: "selecionado", arquivo, resultado: null, mensagemErro: null });
  }, []);

  const remover = useCallback(() => setDados(ESTADO_INICIAL), []);

  const cancelar = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const reiniciar = useCallback(() => {
    cancelar();
    setDados(ESTADO_INICIAL);
  }, [cancelar]);

  const importar = useCallback(async () => {
    const arquivo = dados.arquivo;
    if (!arquivo || dados.estado === "carregando") return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setDados({ estado: "carregando", arquivo, resultado: null, mensagemErro: null });

    try {
      const resultado = await manifestoApi.importarCsv(arquivo, controller.signal);
      setDados({
        estado: resultado.novos.length > 0 ? "atencao" : "sucesso",
        arquivo,
        resultado,
        mensagemErro: null,
      });
    } catch (erro) {
      if (controller.signal.aborted) return; // cancelado pelo usuário
      const mensagem =
        erro instanceof ApiRequestError
          ? erro.message
          : "Não foi possível se conectar ao serviço de manifestos. Verifique sua conexão e tente novamente.";
      // mantém o arquivo para permitir "Tentar novamente" sem nova seleção
      setDados({ estado: "erro", arquivo, resultado: null, mensagemErro: mensagem });
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [dados.arquivo, dados.estado]);

  return { ...dados, selecionar, remover, importar, cancelar, reiniciar };
}
