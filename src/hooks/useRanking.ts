import { useCallback, useEffect, useState } from "react";
import { ApiRequestError } from "../api/client";
import { buscarRanking, type ConsultaRanking, type RankingResponse } from "../api/ranking";

export interface ErroRanking {
  /** permissao: 403 · validacao: 400 (mensagem da API) · falha: rede, 5xx e demais. */
  tipo: "permissao" | "validacao" | "falha";
  mensagem: string;
}

type Resultado =
  | { chave: string; resposta: RankingResponse; erro: null; recebidoEm: number }
  | { chave: string; resposta: null; erro: ErroRanking; recebidoEm: number };

const MENSAGEM_FALHA = "Não foi possível carregar o ranking. Tente novamente.";
const MENSAGEM_PERMISSAO = "Você não tem permissão para acessar o ranking.";

function chaveDe({ ano, mes, tipo, busca }: ConsultaRanking, tentativa: number) {
  return `${ano}-${mes}-${tipo}-${tentativa}-${busca}`;
}

function traduzirErro(error: unknown): ErroRanking {
  if (error instanceof ApiRequestError) {
    if (error.status === 403) return { tipo: "permissao", mensagem: MENSAGEM_PERMISSAO };
    if (error.status === 400) return { tipo: "validacao", mensagem: error.message };
  }
  // rede, 5xx e qualquer outro caso: mensagem única, sem detalhe técnico
  return { tipo: "falha", mensagem: MENSAGEM_FALHA };
}

/**
 * Consulta o ranking do período/visão/busca e refaz a consulta sozinho quando
 * qualquer um deles muda. Só o resultado da consulta mais recente é exposto:
 * enquanto ela não responde, `carregando` fica ligado e nada da anterior aparece.
 */
export function useRanking(consulta: ConsultaRanking, habilitado = true) {
  const { ano, mes, tipo, busca } = consulta;
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const recarregar = useCallback(() => setTentativa((valor) => valor + 1), []);

  const chave = chaveDe(consulta, tentativa);

  useEffect(() => {
    if (!habilitado) return;

    const controle = new AbortController();
    const chaveDaConsulta = chaveDe({ ano, mes, tipo, busca }, tentativa);

    buscarRanking({ ano, mes, tipo, busca }, controle.signal)
      .then((resposta) => {
        if (controle.signal.aborted) return;
        setResultado({ chave: chaveDaConsulta, resposta, erro: null, recebidoEm: Date.now() });
      })
      .catch((error: unknown) => {
        if (controle.signal.aborted) return;
        // 401: o client já avisou o AuthContext e o app volta ao login — sem erro na tela
        if (error instanceof ApiRequestError && error.status === 401) return;
        setResultado({
          chave: chaveDaConsulta,
          resposta: null,
          erro: traduzirErro(error),
          recebidoEm: Date.now(),
        });
      });

    // filtro mudou ou a tela fechou: cancela e descarta a resposta antiga
    return () => controle.abort();
  }, [ano, mes, tipo, busca, tentativa, habilitado]);

  const atual = habilitado && resultado?.chave === chave ? resultado : null;

  return {
    resposta: atual?.resposta ?? null,
    erro: atual?.erro ?? null,
    carregando: habilitado && !atual,
    /** Quando a resposta exibida chegou do serviço (relógio do navegador). */
    atualizadoEm: atual?.resposta ? new Date(atual.recebidoEm) : null,
    recarregar,
  };
}
