import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useImportManifesto } from "../context/ImportManifestoContext";
import { useFrota } from "../context/FrotaContext";
import { useDashboard } from "../hooks/useDashboard";
import { icons } from "../components/icons";
import { KpiCard } from "../components/dashboard/KpiCard";
import { ResumoPeriodo } from "../components/dashboard/ResumoPeriodo";
import { Destaques } from "../components/dashboard/Destaques";
import { FrotaPorTipo } from "../components/dashboard/FrotaPorTipo";
import { SecaoDashboard } from "../components/dashboard/SecaoDashboard";
import { ComposicaoFrete } from "../components/dashboard/ComposicaoFrete";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton";
import { RentabilidadeMedia } from "../components/RentabilidadeMedia";
import { baixarCsv, numeroCsv } from "../utils/exportarCsv";
import { decimal1, inteiro, moeda } from "../utils/formatadores";
import { variacaoPercentual, variacaoPontos, type Variacao } from "../utils/variacao";
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

function nomeDoMes(ano: number, mes: number) {
  const data = new Date(0);
  data.setFullYear(ano, mes - 1, 1);

  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(data);
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

  // Cadastro de motoristas e frota: a MESMA fonte do menu lateral e da tela de
  // Motoristas, que também recarrega sozinha a cada importação de CSV.
  const {
    motoristas: cadastrados,
    resumo: frota,
    carregando: carregandoFrota,
    erro: erroFrota,
    recarregar: recarregarFrota,
  } = useFrota();

  const recarregarTudo = useCallback(() => {
    recarregar();
    recarregarFrota();
  }, [recarregar, recarregarFrota]);

  // Atualização automática: só recarrega com a aba visível, para não gastar requisições à toa.
  useEffect(() => {
    if (!autoAtualizar) return;

    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") recarregarTudo();
    }, INTERVALO_AUTO_MS);

    return () => window.clearInterval(id);
  }, [autoAtualizar, recarregarTudo]);

  function alternarAuto() {
    const ligado = !autoAtualizar;
    setAutoAtualizar(ligado);

    try {
      localStorage.setItem(CHAVE_AUTO, ligado ? "1" : "0");
    } catch {
      // sem armazenamento disponível: a preferência vale só para esta sessão
    }
  }

  const valorPeriodo =
    `${String(periodo.ano).padStart(4, "0")}-` + String(periodo.mes).padStart(2, "0");
  const nomePeriodo = nomeDoMes(periodo.ano, periodo.mes);
  const nomePeriodoAnterior = nomeDoMes(
    periodo.mes === 1 ? periodo.ano - 1 : periodo.ano,
    periodo.mes === 1 ? 12 : periodo.mes - 1
  );

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

  const detalhe = (texto: string) => `${nomePeriodoAnterior}: ${texto}`;

  const variacaoRentabilidade = geral
    ? variacaoPercentual(geral.rentabilidadeTotal, ant?.rentabilidadeTotal)
    : null;

  function exportarResumo() {
    if (!geral) return;

    const linha = (
      nome: string,
      valor: number,
      anteriorValor: number | null | undefined,
      variacao: Variacao | null
    ): (string | number)[] => [
      nome,
      numeroCsv(valor),
      anteriorValor == null ? "" : numeroCsv(anteriorValor),
      variacao?.texto ?? "",
    ];

    baixarCsv(`resumo-dashboard-${valorPeriodo}.csv`, [
      ["Indicador", nomePeriodo, nomePeriodoAnterior, "Variação"],
      linha("Fretes totais (R$)", geral.freteTotal, ant?.freteTotal, variacaoPercentual(geral.freteTotal, ant?.freteTotal)),
      linha("Custos totais (R$)", geral.custoTotal, ant?.custoTotal, variacaoPercentual(geral.custoTotal, ant?.custoTotal, { invertido: true })),
      linha("Rentabilidade total (R$)", geral.rentabilidadeTotal, ant?.rentabilidadeTotal, variacaoRentabilidade),
      linha("Rentabilidade média por viagem (R$)", mediaPorViagem, mediaAnterior, mediaAnterior === null ? null : variacaoPercentual(mediaPorViagem, mediaAnterior)),
      ["Viagens", geral.quantidadeViagens, ant?.quantidadeViagens ?? "", variacaoPercentual(geral.quantidadeViagens, ant?.quantidadeViagens)?.texto ?? ""],
      linha("Margem (%)", margem, margemAnterior, variacaoPontos(margem, margemAnterior)),
    ]);
  }

  const ocupado = carregando || atualizando || carregandoFrota;

  // Quantos cadastrados tiveram ao menos uma viagem no mês (para explicar a diferença
  // entre o total de motoristas cadastrados e o que aparece no desempenho do período).
  const idsComViagem = new Set(
    (atual?.porMotorista ?? []).filter((m) => m.id !== null).map((m) => m.id)
  );
  const cadastradosComViagem = cadastrados.filter((m) => idsComViagem.has(m.id)).length;
  const cadastradosSemViagem = Math.max(frota.totalMotoristas - cadastradosComViagem, 0);
  const pctOperacao =
    frota.totalMotoristas > 0 ? (frota.emOperacao / frota.totalMotoristas) * 100 : 0;

  return (
    <div className={styles.page} aria-busy={ocupado}>
      <span className={styles.eyebrow}>Painel financeiro</span>
      <h1 className={styles.title}>Visão geral</h1>
      <p className={styles.subtitle}>
        Acompanhe fretes, custos e rentabilidade da operação em {nomePeriodo} — com comparação
        automática com o mês anterior.
      </p>

      <div className={styles.toolbar} role="toolbar" aria-label="Filtros e ações do painel">
        <div className={styles.periodo}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => irParaIndice(indicePeriodo - 1)}
            disabled={!podeVoltar}
            aria-label="Mês anterior"
            title="Mês anterior"
          >
            <FontAwesomeIcon icon={icons.chevronLeft} />
          </button>

          <label className={styles.periodoCampo} htmlFor="dashboard-periodo">
            <FontAwesomeIcon icon={icons.calendarDays} aria-hidden="true" />
            <span className={styles.somenteLeitor}>Mês e ano</span>
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
          </label>

          <button
            type="button"
            className={styles.navBtn}
            onClick={() => irParaIndice(indicePeriodo + 1)}
            disabled={!podeAvancar}
            aria-label="Próximo mês"
            title="Próximo mês"
          >
            <FontAwesomeIcon icon={icons.chevronRight} />
          </button>
        </div>

        {!ehMesAtual && (
          <button type="button" className={styles.chip} onClick={() => irParaIndice(indiceAtual)}>
            <FontAwesomeIcon icon={icons.calendarDay} /> Mês atual
          </button>
        )}

        <button
          type="button"
          className={`${styles.chip} ${autoAtualizar ? styles.chipAtivo : ""}`}
          onClick={alternarAuto}
          aria-pressed={autoAtualizar}
          title="Recarrega os indicadores a cada 60 segundos"
        >
          <FontAwesomeIcon icon={icons.bolt} /> Atualização automática
          {autoAtualizar && <span className={styles.pulso} aria-hidden="true" />}
        </button>

        <span className={styles.espaco} />

        {atualizadoEm && (
          <span className={styles.status}>
            <FontAwesomeIcon icon={icons.clock} aria-hidden="true" /> Atualizado às{" "}
            {formatadorHora.format(atualizadoEm)}
          </span>
        )}

        <button
          type="button"
          className={styles.chip}
          onClick={exportarResumo}
          disabled={!geral}
          title="Baixar os indicadores do período em CSV"
        >
          <FontAwesomeIcon icon={icons.download} /> Exportar resumo
        </button>

        <button
          type="button"
          className={`${styles.chip} ${styles.chipPrimario}`}
          onClick={recarregarTudo}
          disabled={ocupado}
        >
          <FontAwesomeIcon icon={icons.retry} spin={atualizando} />{" "}
          {atualizando ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {carregando && (
        <>
          <p className={styles.somenteLeitor} role="status">
            Carregando indicadores...
          </p>
          <DashboardSkeleton />
        </>
      )}

      {!carregando && erro && (
        <div className={styles.errorBox} role="alert">
          <FontAwesomeIcon icon={icons.error} className={styles.errorIcon} />
          <p>
            {atual
              ? `Não foi possível atualizar: ${erro} Exibindo os últimos dados carregados.`
              : erro}
          </p>

          <button type="button" className={styles.retryBtn} onClick={recarregarTudo}>
            <FontAwesomeIcon icon={icons.retry} /> Tentar novamente
          </button>
        </div>
      )}

      {!carregando && atual && geral && (
        <>
          <ResumoPeriodo
            nomePeriodo={nomePeriodo}
            geral={geral}
            margem={margem}
            variacao={variacaoRentabilidade}
          />

          <SecaoDashboard
            id="sec-indicadores"
            icone={icons.chartLine}
            titulo="Indicadores do período"
            dica="Cada indicador mostra a variação frente ao mês anterior."
          >
            <div className={styles.grid}>
              <KpiCard
                indice={0}
                titulo="Fretes totais"
                valor={geral.freteTotal}
                formato="moeda"
                icone={icons.wallet}
                cor="brand"
                descricao="Soma dos fretes do período."
                variacao={variacaoPercentual(geral.freteTotal, ant?.freteTotal)}
                detalheVariacao={ant ? detalhe(moeda.format(ant.freteTotal)) : undefined}
              />

              <KpiCard
                indice={1}
                titulo="Custos totais"
                valor={geral.custoTotal}
                formato="moeda"
                icone={icons.receipt}
                cor="amber"
                descricao="Pedágios registrados no período."
                variacao={variacaoPercentual(geral.custoTotal, ant?.custoTotal, {
                  invertido: true,
                })}
                detalheVariacao={ant ? detalhe(moeda.format(ant.custoTotal)) : undefined}
              />

              <KpiCard
                indice={2}
                titulo="Rentabilidade total"
                valor={geral.rentabilidadeTotal}
                formato="moeda"
                icone={icons.chartLine}
                cor={geral.rentabilidadeTotal < 0 ? "red" : "green"}
                tom="auto"
                descricao={
                  geral.rentabilidadeTotal < 0
                    ? "Resultado negativo no período."
                    : "Fretes menos custos do período."
                }
                variacao={variacaoRentabilidade}
                detalheVariacao={ant ? detalhe(moeda.format(ant.rentabilidadeTotal)) : undefined}
              />

              <KpiCard
                indice={3}
                titulo="Rentabilidade média por viagem"
                valor={mediaPorViagem}
                formato="moeda"
                icone={icons.scale}
                cor="cyan"
                tom="auto"
                descricao={
                  semViagens
                    ? "Nenhuma viagem no período selecionado."
                    : `Rentabilidade total ÷ ${inteiro.format(geral.quantidadeViagens)} ${
                        geral.quantidadeViagens === 1 ? "viagem" : "viagens"
                      } no período.`
                }
                variacao={
                  mediaAnterior === null ? null : variacaoPercentual(mediaPorViagem, mediaAnterior)
                }
                detalheVariacao={
                  mediaAnterior === null ? undefined : detalhe(moeda.format(mediaAnterior))
                }
              />

              <KpiCard
                indice={4}
                titulo="Viagens no período"
                valor={geral.quantidadeViagens}
                formato="inteiro"
                icone={icons.road}
                cor="brand"
                descricao="Quantidade de viagens consideradas nos indicadores."
                variacao={variacaoPercentual(geral.quantidadeViagens, ant?.quantidadeViagens)}
                detalheVariacao={ant ? detalhe(inteiro.format(ant.quantidadeViagens)) : undefined}
              />

              <KpiCard
                indice={5}
                titulo="Margem"
                valor={margem}
                formato="percentual"
                icone={icons.percent}
                cor={margem < 0 ? "red" : "green"}
                tom="auto"
                descricao="Rentabilidade total ÷ fretes totais."
                variacao={variacaoPontos(margem, margemAnterior)}
                detalheVariacao={
                  margemAnterior === null
                    ? undefined
                    : detalhe(`${decimal1.format(margemAnterior)}%`)
                }
              />
            </div>
          </SecaoDashboard>

          {!semViagens && (
            <SecaoDashboard
              id="sec-destaques"
              icone={icons.trophy}
              titulo="Destaques do período"
              dica="Quem mais rende, quem mais roda e onde é preciso atenção."
            >
              <Destaques dados={atual} />
            </SecaoDashboard>
          )}

          <SecaoDashboard
            id="sec-frota"
            icone={icons.truck}
            titulo="Frota e cadastro"
            dica="Mesma base da tela de Motoristas — atualizada a cada importação de CSV."
          >
            {carregandoFrota && cadastrados.length === 0 ? (
              <div className={styles.frotaCarregando} aria-hidden="true" />
            ) : erroFrota && cadastrados.length === 0 ? (
              <div className={styles.frotaErro} role="alert">
                <span>{erroFrota}</span>
                <button type="button" className={styles.chip} onClick={recarregarFrota}>
                  <FontAwesomeIcon icon={icons.retry} /> Tentar novamente
                </button>
              </div>
            ) : (
              <>
                <div className={`${styles.grid} ${styles.gridFrota}`}>
                  <KpiCard
                    indice={0}
                    titulo="Motoristas cadastrados"
                    valor={frota.totalMotoristas}
                    formato="inteiro"
                    icone={icons.idCard}
                    cor="brand"
                    descricao={`${inteiro.format(cadastradosComViagem)} com viagens em ${nomePeriodo} · ${inteiro.format(cadastradosSemViagem)} sem viagens no período.`}
                  />

                  <KpiCard
                    indice={1}
                    titulo="Veículos na frota"
                    valor={frota.veiculos.length}
                    formato="inteiro"
                    icone={icons.truck}
                    cor="cyan"
                    descricao={`${inteiro.format(frota.quantidadeTipos)} ${
                      frota.quantidadeTipos === 1 ? "tipo" : "tipos"
                    } de veículo${
                      frota.motoristasSemVeiculo > 0
                        ? ` · ${inteiro.format(frota.motoristasSemVeiculo)} ${
                            frota.motoristasSemVeiculo === 1 ? "motorista" : "motoristas"
                          } sem veículo`
                        : ""
                    }.`}
                  />

                  <KpiCard
                    indice={2}
                    titulo="Em operação"
                    valor={frota.emOperacao}
                    formato="inteiro"
                    icone={icons.route}
                    cor="amber"
                    descricao={`${decimal1.format(pctOperacao)}% dos motoristas cadastrados.`}
                  />

                  <KpiCard
                    indice={3}
                    titulo="Disponíveis"
                    valor={frota.disponiveis}
                    formato="inteiro"
                    icone={icons.success}
                    cor="green"
                    descricao="Prontos para novas viagens."
                  />
                </div>

                <div className={styles.frotaTipos}>
                  <FrotaPorTipo
                    frota={frota}
                    porVeiculo={atual.porVeiculo ?? []}
                    nomePeriodo={nomePeriodo}
                  />
                </div>
              </>
            )}
          </SecaoDashboard>

          <SecaoDashboard
            id="sec-composicao"
            icone={icons.chartPie}
            titulo="Composição do frete"
            dica="Quanto do frete vira custo e quanto sobra de resultado."
          >
            <ComposicaoFrete frete={geral.freteTotal} custo={geral.custoTotal} />
          </SecaoDashboard>

          <SecaoDashboard
            id="sec-comparativo"
            icone={icons.rankingStar}
            titulo="Comparativo de rentabilidade"
            dica="Explore por motorista ou veículo, ordene, busque e exporte."
          >
            <RentabilidadeMedia dados={atual} cadastrados={cadastrados} frota={frota} />
          </SecaoDashboard>

          <p className={styles.note}>
            <FontAwesomeIcon icon={icons.info} aria-hidden="true" />
            <span>
              Custos = pedágios registrados.
              {ant ? " As variações comparam com o mês anterior." : ""} Os totais de motoristas e
              veículos vêm do cadastro (mesma base da tela de Motoristas); o comparativo inclui
              quem não teve viagens no mês.
            </span>
          </p>
        </>
      )}
    </div>
  );
}
