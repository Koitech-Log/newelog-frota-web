import { useMemo, useState, type CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { RentabilidadeMediaResponse } from "../api/dashboard";
import type { MotoristaResumo } from "../types/motorista";
import { icons } from "./icons";
import {
  rankingMotoristas,
  rankingVeiculos,
  type ItemRanking,
  type ResumoFrota,
} from "../utils/frota";
import { baixarCsv, numeroCsv, textoSeguro } from "../utils/exportarCsv";
import { inteiro, moeda } from "../utils/formatadores";
import styles from "./RentabilidadeMedia.module.css";

type Tipo = "motorista" | "veiculo";
type ChaveOrdem = "nome" | "quantidadeViagens" | "rentabilidadeTotal" | "rentabilidadeMedia";
type Direcao = "asc" | "desc";

const LIMITE_INICIAL = 10;

const ROTULOS: Record<Tipo, { singular: string; plural: string }> = {
  motorista: { singular: "Motorista", plural: "Motoristas" },
  veiculo: { singular: "Veículo", plural: "Veículos" },
};

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function classeSinal(valor: number) {
  return valor < 0 ? styles.negative : valor > 0 ? styles.positive : undefined;
}

interface RentabilidadeMediaProps {
  dados: RentabilidadeMediaResponse;
  /** Motoristas cadastrados (mesma base da tela de Motoristas). */
  cadastrados?: MotoristaResumo[] | null;
  /** Frota derivada do cadastro. */
  frota?: ResumoFrota | null;
}

const SEM_DADOS = { semViagens: false, detalhe: null } as const;

export function RentabilidadeMedia({ dados, cadastrados, frota }: RentabilidadeMediaProps) {
  const [tipo, setTipo] = useState<Tipo>("motorista");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<{ chave: ChaveOrdem; direcao: Direcao }>({
    chave: "rentabilidadeMedia",
    direcao: "desc",
  });
  const [expandido, setExpandido] = useState(false);
  const [incluirSemViagens, setIncluirSemViagens] = useState(true);

  // Quem fez viagens no mês (dados do dashboard) + quem está cadastrado mas ficou
  // parado: assim as contagens batem com a tela de Motoristas e com o menu.
  const motoristasBase = useMemo<ItemRanking[]>(
    () =>
      cadastrados
        ? rankingMotoristas(dados.porMotorista, cadastrados)
        : dados.porMotorista.map((item) => ({ ...item, ...SEM_DADOS })),
    [dados.porMotorista, cadastrados]
  );
  const veiculosBase = useMemo<ItemRanking[]>(
    () =>
      frota
        ? rankingVeiculos(dados.porVeiculo ?? [], frota)
        : (dados.porVeiculo ?? []).map((item) => ({ ...item, ...SEM_DADOS })),
    [dados.porVeiculo, frota]
  );

  const base = tipo === "motorista" ? motoristasBase : veiculosBase;
  const semViagensQtd = base.filter((item) => item.semViagens).length;
  const comViagensQtd = base.length - semViagensQtd;

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    const visiveisBase = incluirSemViagens ? base : base.filter((item) => !item.semViagens);
    const lista = termo
      ? visiveisBase.filter((item) => normalizar(`${item.nome} ${item.detalhe ?? ""}`).includes(termo))
      : visiveisBase;
    const sentido = ordem.direcao === "asc" ? 1 : -1;
    const porValor = ordem.chave === "rentabilidadeTotal" || ordem.chave === "rentabilidadeMedia";

    return [...lista].sort((a, b) => {
      // quem não teve viagem não tem média: fica sempre no fim das ordenações por valor
      if (porValor && a.semViagens !== b.semViagens) return a.semViagens ? 1 : -1;

      const comparacao =
        ordem.chave === "nome"
          ? a.nome.localeCompare(b.nome, "pt-BR")
          : a[ordem.chave] - b[ordem.chave];

      return comparacao * sentido || a.nome.localeCompare(b.nome, "pt-BR");
    });
  }, [base, busca, ordem, incluirSemViagens]);

  const visiveis = expandido ? filtrados : filtrados.slice(0, LIMITE_INICIAL);
  const maiorMedia = Math.max(
    0,
    ...filtrados.filter((item) => !item.semViagens).map((item) => Math.abs(item.rentabilidadeMedia))
  );

  function alternarOrdem(chave: ChaveOrdem) {
    setOrdem((atual) =>
      atual.chave === chave
        ? { chave, direcao: atual.direcao === "asc" ? "desc" : "asc" }
        : { chave, direcao: chave === "nome" ? "asc" : "desc" }
    );
  }

  function trocarTipo(novo: Tipo) {
    if (novo === tipo) return;
    setTipo(novo);
    setBusca("");
    setExpandido(false);
  }

  function exportar() {
    const { singular, plural } = ROTULOS[tipo];
    const mes = String(dados.mes).padStart(2, "0");

    baixarCsv(`rentabilidade-${normalizar(plural)}-${dados.ano}-${mes}.csv`, [
      [singular, "Detalhes", "Viagens", "Rentabilidade total", "Média por viagem"],
      ...filtrados.map((item) => [
        textoSeguro(item.nome),
        textoSeguro(item.detalhe ?? ""),
        item.quantidadeViagens,
        numeroCsv(item.rentabilidadeTotal),
        numeroCsv(item.rentabilidadeMedia),
      ]),
    ]);
  }

  function cabecalho(chave: ChaveOrdem, rotulo: string) {
    const ativa = ordem.chave === chave;
    const sentido = ativa ? (ordem.direcao === "asc" ? "ascending" : "descending") : "none";

    return (
      <th scope="col" aria-sort={sentido}>
        <button type="button" className={styles.sortBtn} onClick={() => alternarOrdem(chave)}>
          {rotulo}
          <span
            className={`${styles.seta} ${ativa ? styles.setaAtiva : ""} ${
              ativa && ordem.direcao === "asc" ? styles.setaAsc : ""
            }`}
            aria-hidden="true"
          >
            ▼
          </span>
        </button>
      </th>
    );
  }

  const { singular, plural } = ROTULOS[tipo];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <p className={styles.description}>
          Rentabilidade média por {singular.toLowerCase()} no período — clique nos títulos para
          ordenar.
        </p>

        <div className={styles.acoes}>
          <div className={styles.segmentado} role="group" aria-label="Comparar por">
            {(Object.keys(ROTULOS) as Tipo[]).map((chave) => (
              <button
                key={chave}
                type="button"
                className={`${styles.segmento} ${tipo === chave ? styles.segmentoAtivo : ""}`}
                aria-pressed={tipo === chave}
                onClick={() => trocarTipo(chave)}
              >
                {ROTULOS[chave].plural}{" "}
                <span className={styles.qtdAba}>
                  {inteiro.format((chave === "motorista" ? motoristasBase : veiculosBase).length)}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className={styles.exportar}
            onClick={exportar}
            disabled={filtrados.length === 0}
          >
            <FontAwesomeIcon icon={icons.fileCsv} /> Exportar CSV
          </button>
        </div>
      </div>

      {base.length === 0 ? (
        <p className={styles.vazio}>
          {dados.geral.quantidadeViagens === 0
            ? "Nenhuma viagem no período selecionado."
            : `Sem dados de ${plural.toLowerCase()} no período selecionado.`}
        </p>
      ) : (
        <>
          {dados.geral.quantidadeViagens === 0 && (
            <p className={styles.aviso}>
              Nenhuma viagem no período — exibindo apenas os {plural.toLowerCase()} cadastrados.
            </p>
          )}
          <div className={styles.busca}>
            <FontAwesomeIcon icon={icons.search} aria-hidden="true" />
            <input
              type="search"
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setExpandido(false);
              }}
              placeholder={`Buscar ${singular.toLowerCase()}…`}
              aria-label={`Buscar ${singular.toLowerCase()}`}
            />
            <span className={styles.contagem} aria-live="polite">
              {filtrados.length} {filtrados.length === 1 ? singular.toLowerCase() : plural.toLowerCase()}
              {semViagensQtd > 0 && ` · ${comViagensQtd} com viagens`}
            </span>
          </div>

          {semViagensQtd > 0 && (
            <button
              type="button"
              className={`${styles.filtroChip} ${incluirSemViagens ? styles.filtroChipAtivo : ""}`}
              aria-pressed={incluirSemViagens}
              onClick={() => {
                setIncluirSemViagens((valor) => !valor);
                setExpandido(false);
              }}
            >
              Incluir {plural.toLowerCase()} sem viagens no período ({inteiro.format(semViagensQtd)})
            </button>
          )}

          {filtrados.length === 0 ? (
            <p className={styles.vazio}>Nenhum resultado{busca ? ` para “${busca}”` : ""}.</p>
          ) : (
            <div
              className={styles.tableScroll}
              role="region"
              aria-label={`Comparativo de rentabilidade por ${singular.toLowerCase()}`}
              tabIndex={0}
            >
              <table className={styles.table}>
                <caption className={styles.caption}>
                  Rentabilidade por {singular.toLowerCase()} no período selecionado
                </caption>
                <thead>
                  <tr>
                    {cabecalho("nome", singular)}
                    {cabecalho("quantidadeViagens", "Viagens")}
                    {cabecalho("rentabilidadeTotal", "Rentabilidade total")}
                    {cabecalho("rentabilidadeMedia", "Média por viagem")}
                  </tr>
                </thead>
                {/* a key reinicia a animação de entrada ao trocar de aba, busca ou ordem */}
                <tbody key={`${tipo}-${busca}-${ordem.chave}-${ordem.direcao}-${expandido}`}>
                  {visiveis.map((item, i) => {
                    const largura = maiorMedia
                      ? Math.max(4, (Math.abs(item.rentabilidadeMedia) / maiorMedia) * 100)
                      : 0;

                    return (
                      <tr
                        key={`${item.id ?? "sem-cadastro"}-${item.nome}`}
                        className={`${styles.linha} ${item.semViagens ? styles.linhaParada : ""}`}
                        style={{ "--i": i } as CSSProperties}
                      >
                        <th scope="row">
                          <span className={styles.nomeLinha}>{item.nome}</span>
                          {item.detalhe && <span className={styles.detalheLinha}>{item.detalhe}</span>}
                        </th>
                        <td>{inteiro.format(item.quantidadeViagens)}</td>
                        <td>{item.semViagens ? "—" : moeda.format(item.rentabilidadeTotal)}</td>
                        <td className={item.semViagens ? undefined : classeSinal(item.rentabilidadeMedia)}>
                          <span className={styles.mediaCelula}>
                            <span className={styles.trilho} aria-hidden="true">
                              {!item.semViagens && item.rentabilidadeMedia !== 0 && (
                                <span
                                  className={`${styles.barra} ${
                                    item.rentabilidadeMedia < 0 ? styles.barraNegativa : ""
                                  }`}
                                  style={{ "--w": `${largura}%` } as CSSProperties}
                                />
                              )}
                            </span>
                            {item.semViagens ? "—" : moeda.format(item.rentabilidadeMedia)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtrados.length > LIMITE_INICIAL && (
            <button
              type="button"
              className={styles.verMais}
              onClick={() => setExpandido((valor) => !valor)}
              aria-expanded={expandido}
            >
              {expandido
                ? `Mostrar apenas ${LIMITE_INICIAL}`
                : `Ver todos (${filtrados.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
