import { useCallback, useEffect, useState } from "react";
import { buscarRentabilidadeMedia, type RentabilidadeMediaResponse } from "../api/dashboard";

interface DadosDoPeriodo {
  chave: string;
  atual: RentabilidadeMediaResponse;
  /** Mês anterior, usado só para comparação. null se não existir ou falhar. */
  anterior: RentabilidadeMediaResponse | null;
}

export function chavePeriodo(ano: number, mes: number) {
  return `${ano}-${mes}`;
}

/**
 * Carrega os indicadores do período e, em paralelo, os do mês anterior
 * (para mostrar a variação). Ao recarregar o mesmo período os dados antigos
 * continuam na tela; ao trocar de período, `dados` fica indisponível até
 * a resposta chegar.
 */
export function useDashboard(ano: number, mes: number, gatilhoExterno: number) {
  const [dados, setDados] = useState<DadosDoPeriodo | null>(null);
  const [buscando, setBuscando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  const recarregar = useCallback(() => setTick((valor) => valor + 1), []);

  useEffect(() => {
    let cancelado = false;
    const chave = chavePeriodo(ano, mes);
    const [anoAnterior, mesAnterior] = mes === 1 ? [ano - 1, 12] : [ano, mes - 1];

    setBuscando(true);
    setErro(null);

    Promise.all([
      buscarRentabilidadeMedia(ano, mes),
      anoAnterior >= 1
        ? buscarRentabilidadeMedia(anoAnterior, mesAnterior).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([atual, anterior]) => {
        if (cancelado) return;
        setDados({ chave, atual, anterior });
        setAtualizadoEm(new Date());
      })
      .catch((error: unknown) => {
        if (cancelado) return;
        setErro(
          error instanceof Error ? error.message : "Não foi possível carregar os indicadores."
        );
      })
      .finally(() => {
        if (!cancelado) setBuscando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [ano, mes, tick, gatilhoExterno]);

  const doPeriodo = dados && dados.chave === chavePeriodo(ano, mes) ? dados : null;

  return {
    atual: doPeriodo?.atual ?? null,
    anterior: doPeriodo?.anterior ?? null,
    /** Primeira carga do período (sem nada para mostrar ainda). */
    carregando: buscando && !doPeriodo,
    /** Recarga em segundo plano com dados já na tela. */
    atualizando: buscando && !!doPeriodo,
    erro,
    atualizadoEm,
    recarregar,
  };
}
