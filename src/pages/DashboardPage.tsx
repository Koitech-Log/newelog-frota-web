import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useImportManifesto } from "../context/ImportManifestoContext";
import { useDashboard } from "../hooks/useDashboard";
import { icons } from "../components/icons";
import { KpiCard } from "../components/dashboard/KpiCard";
import { ComposicaoFrete } from "../components/dashboard/ComposicaoFrete";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton";
import { RentabilidadeMedia } from "../components/RentabilidadeMedia";
import { decimal1, inteiro, moeda } from "../utils/formatadores";
import { variacaoPercentual, variacaoPontos } from "../utils/variacao";
import styles from "./DashboardPage.module.css";

const INTERVALO_AUTO_MS = 60_000;
const CHAVE_AUTO = "dashboard:atualizar-automaticamente";

const formatadorHora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

function lerAutoAtualizar(): boolean {
  try {
    return localStorage.getItem(CHAVE_AUTO) === "1";
  } catch {
    return false;
  }
}

function indiceDoMes(data: Date) {
  return data.getFullYear() * 12 + data.getMonth();
}

function margemDe(frete: number, rentabilidade: number) {
  return frete > 0 ? (rentabilidade / frete) * 100 : 0;
}

export function DashboardPage() {
  const [hoje] = useState(() => new Date());
  const [periodo, setPeriodo] = useState(() => ({
    ano: hoje.getFullYear(),
    mes: hoje.getMonth() + 1,
  }));
  const [autoAtualizar, setAutoAtualizar] = useState(lerAutoAtualizar);

  const { versaoImportacao } = useImportManifesto();
  const { atual, anterior, carregando, atualizando, erro, atualizadoEm, recarregar } =
    useDashboard(periodo.ano, periodo.mes, versaoImportacao);

  // Atualização automática: só recarrega com a aba visível, para não gastar requisições à toa.
  useEffect(() => {
    if (!autoAtualizar) return;

    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") recarregar();
    }, INTERVALO_AUTO_MS);

    return () => window.clearInterval(id);
  }, [autoAtualizar, recarregar]);

  function alternarAuto(ligado: boolean) {
    setAutoAtualizar(ligado);

    try {
      localStorage.setItem(CHAVE_AUTO, ligado ? "1" : "0");
    } catch {
      // sem armazenamento disponível: a preferência vale só para esta sessão
    }
  }

  const valorPeriodo =
    `${String(periodo.ano).padStart(4, "0")}-` + String(periodo.mes).padStart(2, "0");

  const dataPeriodo = new Date(0);
  dataPeriodo.setFullYear(periodo.ano, periodo.mes - 1, 1);

  const nomePeriodo = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(dataPeriodo);

  const indiceAtual = indiceDoMes(hoje);
  const indicePeriodo = periodo.ano * 12 + (periodo.mes - 1);
  const ehMesAtual = indicePeriodo === indiceAtual;
  const podeAvancar = indicePeriodo < indiceAtual;
  const podeVoltar = indicePeriodo > 0;

  function irParaIndice(indice: number) {
    if (indice < 0 || indice === indicePeriodo) return;

    const ano = Math.floor(indice / 12);
    if (ano < 1 || ano > 9999) return;

    setPeriodo({ ano, mes: (indice % 12) + 1 });
  }

  function alterarPeriodo(valor: string) {
    if (!/^\d{4}-\d{2}$/.test(valor)) return;

    const [ano, mes] = valor.split("-").map(Number);
    if (ano < 1 || ano > 9999 || mes < 1 || mes > 12) return;

    irParaIndice(ano * 12 + (mes - 1));
  }

  // ---- indicadores derivados --------------------------------------------------
  const geral = atual?.geral;
  const geralAnterior = anterior?.geral;
  // só compara se o mês anterior teve alguma movimentação
  const comparavel =
    !!geralAnterior &&
    (geralAnterior.quantidadeViagens > 0 ||
      geralAnterior.freteTotal !== 0 ||
      geralAnterior.custoTotal !== 0);
  const ant = comparavel ? geralAnterior : null;

  const semViagens = !geral || geral.quantidadeViagens === 0;
  const mediaPorViagem = geral && !semViagens ? geral.rentabilidadeMedia : 0;
  const mediaAnterior = ant && ant.quantidadeViagens > 0 ? ant.rentabilidadeMedia : null;
  const margem = geral ? margemDe(geral.freteTotal, geral.rentabilidadeTotal) : 0;
  const margemAnterior = ant ? margemDe(ant.freteTotal, ant.rentabilidadeTotal) : null;

  const periodoAnteriorRotulo = (() => {
    const d = new Date(0);
    d.setFullYear(periodo.ano, periodo.mes - 2, 1);
    return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(d);
  })();

  const detalhe = (texto: string) => `${periodoAnteriorRotulo}: ${texto}`;

  return (
    <section
      className={styles.page}
      aria-labelledby="dashboard-titulo"
      aria-busy={carregando || atualizando}
    >
      <header className={styles.header}>
        <div>
          <h1 id="dashboard-titulo" className={styles.title}>
            Visão geral
          </h1>

          <p className={styles.subtitle}>
            Indicadores financeiros de {nomePeriodo}.
            {atualizadoEm && (
              <span className={styles.atualizado}> Atualizado às {formatadorHora.format(atualizadoEm)}.</span>
            )}
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.periodField}>
            <label htmlFor="dashboard-periodo">Mês e ano</label>

            <div className={styles.periodNav}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => irParaIndice(indicePeriodo - 1)}
                disabled={!podeVoltar}
                aria-label="Mês anterior"
                title="Mês anterior"
              >
                <FontAwesomeIcon icon={icons.chevronLeft} />
              </button>

              <input
                id="dashboard-periodo"
                className={styles.periodInput}
                type="month"
                min="0001-01"
                max="9999-12"
                value={valorPeriodo}
                onChange={(event) => alterarPeriodo(event.target.value)}
                required
              />

              <button
                type="button"
                className={styles.iconButton}
                onClick={() => irParaIndice(indicePeriodo + 1)}
                disabled={!podeAvancar}
                aria-label="Próximo mês"
                title="Próximo mês"
              >
                <FontAwesomeIcon icon={icons.chevronRight} />
              </button>
            </div>
          </div>

          {!ehMesAtual && (
            <button
              type="button"
              className={styles.button}
              onClick={() => irParaIndice(indiceAtual)}
            >
              Mês atual
            </button>
          )}

          <label className={styles.toggle} title="Recarrega os indicadores a cada 60 segundos">
            <input
              type="checkbox"
              checked={autoAtualizar}
              onChange={(event) => alternarAuto(event.target.checked)}
            />
            <span className={styles.toggleTrilho} aria-hidden="true" />
            <span>Auto</span>
          </label>

          <button
            type="button"
            className={styles.button}
            onClick={recarregar}
            disabled={carregando || atualizando}
          >
            <FontAwesomeIcon icon={icons.retry} spin={atualizando} />{" "}
            {atualizando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </header>

      {carregando && (
        <>
          <p className={styles.somenteLeitor} role="status">
            Carregando indicadores...
          </p>
          <DashboardSkeleton />
        </>
      )}

      {!carregando && erro && (
        <div className={styles.error} role="alert">
          <p>{atual ? `Não foi possível atualizar: ${erro} Exibindo os últimos dados carregados.` : erro}</p>

          <button type="button" className={styles.button} onClick={recarregar}>
            Tentar novamente
          </button>
        </div>
      )}

      {!carregando && atual && geral && (
        <>
          <div className={styles.grid}>
            <KpiCard
              indice={0}
              titulo="Fretes totais"
              valor={geral.freteTotal}
              formato="moeda"
              icone={icons.money}
              descricao="Soma dos fretes do período."
              variacao={variacaoPercentual(geral.freteTotal, ant?.freteTotal)}
              detalheVariacao={ant ? detalhe(moeda.format(ant.freteTotal)) : undefined}
            />

            <KpiCard
              indice={1}
              titulo="Custos totais"
              valor={geral.custoTotal}
              formato="moeda"
              icone={icons.coins}
              descricao="Pedágios registrados no período."
              variacao={variacaoPercentual(geral.custoTotal, ant?.custoTotal, { invertido: true })}
              detalheVariacao={ant ? detalhe(moeda.format(ant.custoTotal)) : undefined}
            />

            <KpiCard
              indice={2}
              titulo="Rentabilidade total"
              valor={geral.rentabilidadeTotal}
              formato="moeda"
              icone={icons.rankingStar}
              tom="auto"
              descricao={
                geral.rentabilidadeTotal < 0
                  ? "Resultado negativo no período."
                  : "Fretes menos custos do período."
              }
              variacao={variacaoPercentual(geral.rentabilidadeTotal, ant?.rentabilidadeTotal)}
              detalheVariacao={ant ? detalhe(moeda.format(ant.rentabilidadeTotal)) : undefined}
            />

            <KpiCard
              indice={3}
              titulo="Rentabilidade média por viagem"
              valor={mediaPorViagem}
              formato="moeda"
              icone={icons.gauge}
              tom="auto"
              descricao={
                semViagens
                  ? "Nenhuma viagem no período selecionado."
                  : `Rentabilidade total ÷ ${inteiro.format(geral.quantidadeViagens)} ${
                      geral.quantidadeViagens === 1 ? "viagem" : "viagens"
                    } no período.`
              }
              variacao={mediaAnterior === null ? null : variacaoPercentual(mediaPorViagem, mediaAnterior)}
              detalheVariacao={mediaAnterior === null ? undefined : detalhe(moeda.format(mediaAnterior))}
            />

            <KpiCard
              indice={4}
              titulo="Viagens no período"
              valor={geral.quantidadeViagens}
              formato="inteiro"
              icone={icons.route}
              descricao="Quantidade de viagens consideradas nos indicadores."
              variacao={variacaoPercentual(geral.quantidadeViagens, ant?.quantidadeViagens)}
              detalheVariacao={ant ? detalhe(inteiro.format(ant.quantidadeViagens)) : undefined}
            />

            <KpiCard
              indice={5}
              titulo="Margem"
              valor={margem}
              formato="percentual"
              icone={icons.shield}
              tom="auto"
              descricao="Rentabilidade total ÷ fretes totais."
              variacao={variacaoPontos(margem, margemAnterior)}
              detalheVariacao={
                margemAnterior === null ? undefined : detalhe(`${decimal1.format(margemAnterior)}%`)
              }
            />
          </div>

          <div className={styles.secao}>
            <ComposicaoFrete frete={geral.freteTotal} custo={geral.custoTotal} />
          </div>

          <div className={styles.secao}>
            <RentabilidadeMedia dados={atual} />
          </div>

          <p className={styles.note}>
            Custos = pedágios. {ant ? "As variações comparam com o mês anterior." : ""}
          </p>
        </>
      )}
    </section>
  );
}
