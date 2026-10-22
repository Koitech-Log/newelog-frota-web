import { useMemo, useState, type CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { RentabilidadeMediaItem, RentabilidadeMediaResponse } from "../api/dashboard";
import { icons } from "./icons";
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

export function RentabilidadeMedia({ dados }: { dados: RentabilidadeMediaResponse }) {
  const [tipo, setTipo] = useState<Tipo>("motorista");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<{ chave: ChaveOrdem; direcao: Direcao }>({
    chave: "rentabilidadeMedia",
    direcao: "desc",
  });
  const [expandido, setExpandido] = useState(false);

  const semViagens = dados.geral.quantidadeViagens === 0;
  const base: RentabilidadeMediaItem[] | undefined =
    tipo === "motorista" ? dados.porMotorista : dados.porVeiculo;

  const filtrados = useMemo(() => {
    if (!base) return [];
    const termo = normalizar(busca.trim());
    const lista = termo ? base.filter((item) => normalizar(item.nome).includes(termo)) : base;
    const sentido = ordem.direcao === "asc" ? 1 : -1;

    return [...lista].sort((a, b) => {
      const comparacao =
        ordem.chave === "nome"
          ? a.nome.localeCompare(b.nome, "pt-BR")
          : a[ordem.chave] - b[ordem.chave];

      return comparacao * sentido || a.nome.localeCompare(b.nome, "pt-BR");
    });
  }, [base, busca, ordem]);

  const visiveis = expandido ? filtrados : filtrados.slice(0, LIMITE_INICIAL);
  const maiorMedia = Math.max(0, ...filtrados.map((item) => Math.abs(item.rentabilidadeMedia)));

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
      [singular, "Viagens", "Rentabilidade total", "Média por viagem"],
      ...filtrados.map((item) => [
        textoSeguro(item.nome),
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
    <section className={styles.card} aria-labelledby="comparativo-titulo">
      <div className={styles.header}>
        <div>
          <h2 id="comparativo-titulo" className={styles.titulo}>
            Comparativo de rentabilidade média
          </h2>
          <p className={styles.description}>
            Rentabilidade por {singular.toLowerCase()} no período — clique nos títulos para ordenar.
          </p>
        </div>

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
                {ROTULOS[chave].plural}
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

      {semViagens || !base || base.length === 0 ? (
        <p className={styles.vazio}>
          {semViagens
            ? "Nenhuma viagem no período selecionado."
            : `Sem dados de ${plural.toLowerCase()} no período selecionado.`}
        </p>
      ) : (
        <>
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
            </span>
          </div>

          {filtrados.length === 0 ? (
            <p className={styles.vazio}>Nenhum resultado para “{busca}”.</p>
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
                        className={styles.linha}
                        style={{ "--i": i } as CSSProperties}
                      >
                        <th scope="row">{item.nome}</th>
                        <td>{inteiro.format(item.quantidadeViagens)}</td>
                        <td>{moeda.format(item.rentabilidadeTotal)}</td>
                        <td className={classeSinal(item.rentabilidadeMedia)}>
                          <span className={styles.mediaCelula}>
                            <span className={styles.trilho} aria-hidden="true">
                              {item.rentabilidadeMedia !== 0 && (
                                <span
                                  className={`${styles.barra} ${
                                    item.rentabilidadeMedia < 0 ? styles.barraNegativa : ""
                                  }`}
                                  style={{ "--w": `${largura}%` } as CSSProperties}
                                />
                              )}
                            </span>
                            {moeda.format(item.rentabilidadeMedia)}
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
    </section>
  );
}
