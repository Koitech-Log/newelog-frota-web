import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { TipoRanking } from "../api/ranking";
import { icons } from "../components/icons";
import { SeletorPeriodo } from "../components/dashboard/SeletorPeriodo";
import { RankingKpis } from "../components/ranking/RankingKpis";
import { RankingPodio } from "../components/ranking/RankingPodio";
import { RankingKpiSkeleton, RankingSkeleton } from "../components/ranking/RankingSkeleton";
import { RankingTabela } from "../components/ranking/RankingTabela";
import { useImportManifesto } from "../context/ImportManifestoContext";
import { useProfile } from "../context/ProfileContext";
import { useRanking } from "../hooks/useRanking";
import { baixarCsv, numeroCsv, textoSeguro } from "../utils/exportarCsv";
import { inteiro } from "../utils/formatadores";
import styles from "./RankingPage.module.css";

/** Espera o gestor parar de digitar antes de consultar o serviço. */
const ATRASO_BUSCA_MS = 350;
const BUSCA_MAXIMA = 150;
/** Primeiro mês disponível no seletor: janeiro de 2020. */
const INDICE_MINIMO = 2020 * 12;

const VISOES: Record<
  TipoRanking,
  { rotulo: string; singular: string; plural: string; busca: string; vazioBusca: string }
> = {
  motoristas: {
    rotulo: "Motoristas",
    singular: "motorista",
    plural: "motoristas",
    busca: "Buscar por nome ou CPF",
    vazioBusca: "Nenhum motorista encontrado",
  },
  veiculos: {
    rotulo: "Veículos",
    singular: "veículo",
    plural: "veículos",
    busca: "Buscar por placa, nome ou CPF do motorista",
    vazioBusca: "Nenhum veículo encontrado",
  },
};

const CRITERIOS: Record<string, string> = {
  PONTUACAO: "Ordenado por pontuação mensal",
  RESULTADO_FINANCEIRO: "Ordenado por resultado financeiro",
};

const HORA = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

function indiceDoMes(data: Date) {
  return data.getFullYear() * 12 + data.getMonth();
}

function nomeDoMes(ano: number, mes: number) {
  const data = new Date(0);
  data.setFullYear(ano, mes - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(data);
}

/**
 * Ranking mensal da frota (US17). Só é montada para gestores: o menu esconde o
 * item, o App não a renderiza para outros perfis, esta guarda reforça e o
 * ranking-service responde 403 para quem não é gestor.
 */
export function RankingPage() {
  const { perfil } = useProfile();

  if (perfil !== "gestor") {
    return (
      <section className={styles.page}>
        <div className={styles.estado} role="alert">
          <span className={styles.estadoIcone} aria-hidden="true">
            <FontAwesomeIcon icon={icons.lock} />
          </span>
          <p className={styles.estadoTitulo}>Acesso restrito</p>
          <p>Somente gestores podem acessar o ranking.</p>
        </div>
      </section>
    );
  }

  return <RankingConteudo />;
}

function RankingConteudo() {
  const [hoje] = useState(() => new Date());
  const [periodo, setPeriodo] = useState(() => ({
    ano: hoje.getFullYear(),
    mes: hoje.getMonth() + 1,
  }));
  const [tipo, setTipo] = useState<TipoRanking>("motoristas");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");

  // A busca vai ao serviço depois de uma pausa na digitação; limpar é imediato.
  useEffect(() => {
    const termo = busca.trim();
    if (!termo || termo === buscaAplicada) return;
    const id = window.setTimeout(() => setBuscaAplicada(termo), ATRASO_BUSCA_MS);
    return () => window.clearTimeout(id);
  }, [busca, buscaAplicada]);

  function alterarBusca(valor: string) {
    setBusca(valor);
    if (!valor.trim()) setBuscaAplicada("");
  }

  // importação de CSV concluída (botão do cabeçalho): refaz a consulta mantendo a lista na tela
  const { versaoImportacao } = useImportManifesto();
  const { resposta, erro, carregando, atualizando, atualizadoEm, recarregar } = useRanking(
    { ano: periodo.ano, mes: periodo.mes, tipo, busca: buscaAplicada },
    versaoImportacao
  );

  const indiceAtual = indiceDoMes(hoje);
  const indicePeriodo = periodo.ano * 12 + (periodo.mes - 1);
  const podeVoltar = indicePeriodo > INDICE_MINIMO;
  const podeAvancar = indicePeriodo < indiceAtual;

  function irParaIndice(indice: number) {
    if (indice < INDICE_MINIMO || indice > indiceAtual) return;
    setPeriodo({ ano: Math.floor(indice / 12), mes: (indice % 12) + 1 });
  }

  function limparBusca() {
    alterarBusca("");
  }

  const filtrosAtivos =
    busca.trim() !== "" ||
    tipo !== "motoristas" ||
    periodo.ano !== hoje.getFullYear() ||
    periodo.mes !== hoje.getMonth() + 1;

  function limparFiltros() {
    setBusca("");
    setBuscaAplicada("");
    setTipo("motoristas");
    setPeriodo({ ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 });
  }

  const visao = VISOES[tipo];
  const mesNome = nomeDoMes(periodo.ano, periodo.mes);
  const itens = resposta?.dados ?? [];
  // Com busca e lista vazia: se o serviço informa que o mês não teve participantes,
  // o vazio é do mês, não da busca. Sem `totalParticipantes`, vale a busca enviada.
  const vazioDaBusca = !!buscaAplicada && resposta?.totalParticipantes !== 0;
  const criterio = resposta ? CRITERIOS[resposta.criterioOrdenacao] : undefined;
  // digitou e a consulta ainda não saiu: já conta como "atualizando" para o indicador
  const ocupado = carregando || atualizando || busca.trim() !== buscaAplicada;
  // indicadores e pódio descrevem o mês inteiro: com busca ativa só a lista filtrada aparece
  const mostrarResumo = !!resposta && itens.length > 0 && !buscaAplicada;

  function exportarCsv() {
    if (!resposta || itens.length === 0) return;
    const porMotorista = resposta.tipo === "motoristas";
    const cabecalho = [
      "Posição",
      ...(porMotorista ? ["Motorista"] : []),
      "Veículo",
      "Destinos",
      "Viagens",
      "Frete total",
      "Pedágios",
      "Rentabilidade",
      "Pontuação",
    ];
    const linhas = itens.map((item) => [
      item.posicao,
      ...(porMotorista ? [textoSeguro(item.motorista ?? "")] : []),
      textoSeguro(item.veiculo ?? ""),
      textoSeguro(item.destinos.join(", ")),
      item.quantidadeViagens,
      numeroCsv(item.freteTotal),
      numeroCsv(item.custoTotal),
      numeroCsv(item.resultado),
      numeroCsv(item.pontuacao),
    ]);
    baixarCsv(
      `ranking-${resposta.tipo}-${resposta.ano}-${String(resposta.mes).padStart(2, "0")}.csv`,
      [cabecalho, ...linhas],
    );
  }

  return (
    <section className={styles.page} aria-busy={ocupado}>
      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoTexto}>
          <span className={styles.eyebrow}>Desempenho da frota</span>
          <h1 className={styles.title}>
            <span className={styles.tituloIcone} aria-hidden="true">
              <FontAwesomeIcon icon={icons.rankingStar} />
            </span>
            Ranking
          </h1>
          <p className={styles.subtitle}>
            Compare {visao.plural} pela pontuação mensal em {mesNome} de {periodo.ano}.
          </p>
        </div>

        <div className={styles.acoes}>
          <div className={styles.acoesBotoes}>
            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={recarregar}
              disabled={carregando || atualizando}
              title="Buscar os dados novamente"
            >
              <FontAwesomeIcon
                icon={icons.retry}
                spin={carregando || atualizando}
                aria-hidden="true"
              />
              Atualizar
            </button>
            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={exportarCsv}
              disabled={carregando || itens.length === 0}
              title="Baixar a lista exibida em CSV"
            >
              <FontAwesomeIcon icon={icons.download} aria-hidden="true" />
              Exportar CSV
            </button>
          </div>
          {atualizadoEm && !erro && (
            <p className={styles.atualizado}>
              <span className={styles.atualizadoPonto} aria-hidden="true" />
              Atualizado às {HORA.format(atualizadoEm)}
            </p>
          )}
        </div>
      </header>

      <div className={styles.toolbar} role="toolbar" aria-label="Filtros do ranking">
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

          <SeletorPeriodo
            ano={periodo.ano}
            mes={periodo.mes}
            indiceMaximo={indiceAtual}
            indiceMinimo={INDICE_MINIMO}
            onChange={(ano, mes) => irParaIndice(ano * 12 + (mes - 1))}
          />

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

        <div className={styles.segmentado} role="group" aria-label="Visão do ranking">
          {(Object.keys(VISOES) as TipoRanking[]).map((chave) => (
            <button
              key={chave}
              type="button"
              className={`${styles.segmento} ${tipo === chave ? styles.segmentoAtivo : ""}`}
              aria-pressed={tipo === chave}
              onClick={() => setTipo(chave)}
            >
              <FontAwesomeIcon icon={chave === "motoristas" ? icons.users : icons.truck} aria-hidden="true" />
              {VISOES[chave].rotulo}
            </button>
          ))}
        </div>

        <div className={styles.busca}>
          <FontAwesomeIcon icon={icons.search} aria-hidden="true" />
          <input
            type="text"
            inputMode="search"
            value={busca}
            maxLength={BUSCA_MAXIMA}
            onChange={(event) => alterarBusca(event.target.value)}
            placeholder={`${visao.busca}…`}
            aria-label={visao.busca}
            autoComplete="off"
            spellCheck={false}
          />
          {busca && (
            <button
              type="button"
              className={styles.limpar}
              onClick={limparBusca}
              aria-label="Limpar busca"
              title="Limpar busca"
            >
              <FontAwesomeIcon icon={icons.close} />
            </button>
          )}
        </div>

        <button
          type="button"
          className={styles.limparFiltros}
          onClick={limparFiltros}
          disabled={!filtrosAtivos}
        >
          <FontAwesomeIcon icon={icons.filterClear} aria-hidden="true" />
          Limpar filtros
        </button>
      </div>

      <div
        className={`${styles.progresso} ${ocupado ? styles.progressoAtivo : ""}`}
        aria-hidden="true"
      />

      {carregando && (
        <>
          <p className={styles.somenteLeitor} role="status">
            Carregando ranking...
          </p>
          <RankingKpiSkeleton />
          <div className={styles.card}>
            <RankingSkeleton />
          </div>
        </>
      )}

      {!carregando && erro && (
        <div className={styles.card}>
          <div
            className={`${styles.estado} ${erro.tipo === "falha" ? styles.estadoErro : ""}`}
            role="alert"
          >
            <span className={styles.estadoIcone} aria-hidden="true">
              <FontAwesomeIcon icon={erro.tipo === "permissao" ? icons.lock : icons.error} />
            </span>
            <p>{erro.mensagem}</p>
            {erro.tipo === "falha" && (
              <button type="button" className={styles.acao} onClick={recarregar}>
                <FontAwesomeIcon icon={icons.retry} /> Tentar novamente
              </button>
            )}
          </div>
        </div>
      )}

      {!carregando && resposta && itens.length === 0 && (
        <div className={styles.card}>
          <div className={styles.estado} role="status">
            <span className={styles.estadoIcone} aria-hidden="true">
              <FontAwesomeIcon icon={vazioDaBusca ? icons.search : icons.inbox} />
            </span>
            {vazioDaBusca ? (
              <>
                <p>
                  {visao.vazioBusca} para “{buscaAplicada}”.
                </p>
                <button type="button" className={styles.acao} onClick={limparBusca}>
                  <FontAwesomeIcon icon={icons.close} /> Limpar busca
                </button>
              </>
            ) : (
              <p>
                Nenhuma viagem registrada em {mesNome}/{periodo.ano}.
              </p>
            )}
          </div>
        </div>
      )}

      {!carregando && resposta && mostrarResumo && (
        <>
          <RankingKpis
            tipo={resposta.tipo}
            itens={itens}
            totalParticipantes={resposta.totalParticipantes}
            mesNome={mesNome}
          />
          <RankingPodio
            tipo={resposta.tipo}
            itens={itens}
            legenda={`Três primeiros colocados entre ${visao.plural} em ${mesNome} de ${periodo.ano}`}
          />
        </>
      )}

      {!carregando && resposta && itens.length > 0 && (
        <div className={styles.card}>
          <p className={styles.resumo} aria-live="polite">
            {criterio && (
              <span className={styles.criterio}>
                <FontAwesomeIcon icon={icons.rankingStar} aria-hidden="true" /> {criterio}
              </span>
            )}
            {buscaAplicada && (
              <button
                type="button"
                className={styles.filtroAtivo}
                onClick={limparBusca}
                title="Remover filtro de busca"
              >
                “{buscaAplicada}”
                <FontAwesomeIcon icon={icons.close} aria-hidden="true" />
              </button>
            )}
            <span className={styles.contagem}>
              {inteiro.format(itens.length)} {itens.length === 1 ? visao.singular : visao.plural}
              {buscaAplicada &&
                resposta.totalParticipantes != null &&
                ` de ${inteiro.format(resposta.totalParticipantes)}`}
            </span>
          </p>
          <RankingTabela
            key={`${resposta.ano}-${resposta.mes}-${resposta.tipo}`}
            tipo={resposta.tipo}
            itens={itens}
            legenda={`Ranking de ${visao.plural} em ${mesNome} de ${periodo.ano}`}
          />
          <p className={styles.nota}>
            <FontAwesomeIcon icon={icons.info} aria-hidden="true" /> A pontuação soma a rentabilidade
            (frete − pedágio) das viagens que contam no mês, com valorização por destino. Clique nos
            títulos das colunas para reordenar a lista exibida.
          </p>
        </div>
      )}
    </section>
  );
}
