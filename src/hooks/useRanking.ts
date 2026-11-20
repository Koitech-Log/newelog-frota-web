import { useCallback, useEffect, useState } from "react";
import { ApiRequestError } from "../api/client";
import { buscarRanking, type ConsultaRanking, type RankingResponse } from "../api/ranking";

export interface ErroRanking {
  /** permissao: 403 · validacao: 400 (mensagem da API) · falha: rede, 5xx e demais. */
  tipo: "permissao" | "validacao" | "falha";
  mensagem: string;
}

type Resultado = { filtros: string; versao: string; recebidoEm: number } & (
  | { resposta: RankingResponse; erro: null }
  | { resposta: null; erro: ErroRanking }
);

const MENSAGEM_FALHA = "Não foi possível carregar o ranking. Tente novamente.";
const MENSAGEM_PERMISSAO = "Você não tem permissão para acessar o ranking.";

/** Identifica o que está sendo consultado (período, visão e busca). */
function chaveDosFiltros({ ano, mes, tipo, busca }: ConsultaRanking) {
  return `${ano}-${mes}-${tipo}-${busca}`;
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
 * qualquer um deles muda, quando `gatilhoExterno` muda (ex.: importação de CSV
 * concluída) ou ao chamar `recarregar`.
 *
 * Filtro novo: só o resultado da consulta mais recente é exposto; enquanto ela
 * não responde, `carregando` fica ligado e nada do filtro anterior aparece.
 * Mesmo filtro recarregado: a lista atual continua na tela com `atualizando`
 * ligado até a resposta nova chegar (como no Dashboard).
 */
export function useRanking(consulta: ConsultaRanking, gatilhoExterno = 0, habilitado = true) {
  const { ano, mes, tipo, busca } = consulta;
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const recarregar = useCallback(() => setTentativa((valor) => valor + 1), []);

  const filtros = chaveDosFiltros(consulta);
  const versao = `${tentativa}-${gatilhoExterno}`;

  useEffect(() => {
    if (!habilitado) return;

    const controle = new AbortController();
    const base = {
      filtros: chaveDosFiltros({ ano, mes, tipo, busca }),
      versao: `${tentativa}-${gatilhoExterno}`,
    };

    buscarRanking({ ano, mes, tipo, busca }, controle.signal)
      .then((resposta) => {
        if (controle.signal.aborted) return;
        setResultado({ ...base, resposta, erro: null, recebidoEm: Date.now() });
      })
      .catch((error: unknown) => {
        if (controle.signal.aborted) return;
        // 401: o client já avisou o AuthContext e o app volta ao login — sem erro na tela
        if (error instanceof ApiRequestError && error.status === 401) return;
        setResultado({ ...base, resposta: null, erro: traduzirErro(error), recebidoEm: Date.now() });
      });

    // filtro mudou, recarga pedida ou a tela fechou: cancela e descarta a resposta antiga
    return () => controle.abort();
  }, [ano, mes, tipo, busca, tentativa, gatilhoExterno, habilitado]);

  const doFiltro = habilitado && resultado?.filtros === filtros ? resultado : null;
  const emDia = doFiltro?.versao === versao;
  // recarga do mesmo filtro: mantém a lista anterior; um erro anterior não fica na tela
  const exibido = emDia || doFiltro?.resposta ? doFiltro : null;

  return {
    resposta: exibido?.resposta ?? null,
    erro: exibido?.erro ?? null,
    /** Nada para mostrar do filtro atual ainda (primeira carga, filtro novo ou nova tentativa após erro). */
    carregando: habilitado && !exibido,
    /** Recarga em segundo plano com a lista do mesmo filtro já na tela. */
    atualizando: habilitado && !!exibido && !emDia,
    /** Quando a resposta exibida chegou do serviço (relógio do navegador). */
    atualizadoEm: exibido?.resposta ? new Date(exibido.recebidoEm) : null,
    recarregar,
  };
}
