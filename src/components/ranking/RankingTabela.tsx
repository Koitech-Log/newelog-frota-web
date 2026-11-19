import { useMemo, useState, type CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { RankingItem, TipoRanking } from "../../api/ranking";
import { decimal2, iniciais, inteiro, moeda } from "../../utils/formatadores";
import { icons } from "../icons";
import styles from "./RankingTabela.module.css";

interface RankingTabelaProps {
  tipo: TipoRanking;
  itens: RankingItem[];
  /** Texto para leitores de tela, ex.: "Ranking de motoristas em agosto de 2026". */
  legenda: string;
}

type ChaveOrdem = "posicao" | "nome" | "viagens" | "resultado" | "pontuacao";
type Direcao = "asc" | "desc";

const MAX_DESTINOS = 2;

/**
 * Lista do ranking. A posição exibida é sempre a devolvida pela API (com busca ativa
 * ela continua a real). O gestor pode reordenar as linhas visíveis por coluna; a
 * ordem padrão, "Posição", é a do próprio serviço.
 */
export function RankingTabela({ tipo, itens, legenda }: RankingTabelaProps) {
  const porMotorista = tipo === "motoristas";
  const [ordem, setOrdem] = useState<{ chave: ChaveOrdem; direcao: Direcao }>({
    chave: "posicao",
    direcao: "asc",
  });

  const maiorPontuacao = useMemo(
    () => itens.reduce((maior, item) => Math.max(maior, item.pontuacao), 0),
    [itens],
  );

  const linhas = useMemo(() => {
    if (ordem.chave === "posicao" && ordem.direcao === "asc") return itens;
    const sinal = ordem.direcao === "asc" ? 1 : -1;
    const valor = (item: RankingItem) => {
      switch (ordem.chave) {
        case "nome":
          return (item.motorista ?? item.veiculo ?? "").toLocaleLowerCase("pt-BR");
        case "viagens":
          return item.quantidadeViagens;
        case "resultado":
          return item.resultado;
        case "pontuacao":
          return item.pontuacao;
        default:
          return item.posicao;
      }
    };
    return [...itens].sort((a, b) => {
      const va = valor(a);
      const vb = valor(b);
      const comparacao =
        typeof va === "string" && typeof vb === "string" ? va.localeCompare(vb, "pt-BR") : Number(va) - Number(vb);
      return comparacao * sinal || a.posicao - b.posicao;
    });
  }, [itens, ordem]);

  function alternar(chave: ChaveOrdem) {
    setOrdem((atual) => {
      if (atual.chave !== chave) {
        // nomes começam de A a Z; números, do maior para o menor
        return { chave, direcao: chave === "nome" || chave === "posicao" ? "asc" : "desc" };
      }
      return { chave, direcao: atual.direcao === "asc" ? "desc" : "asc" };
    });
  }

  function cabecalho(chave: ChaveOrdem, rotulo: string, classe?: string) {
    const ativa = ordem.chave === chave;
    const aria = ativa ? (ordem.direcao === "asc" ? "ascending" : "descending") : "none";
    const icone = !ativa ? icons.sort : ordem.direcao === "asc" ? icons.sortUp : icons.sortDown;
    return (
      <th scope="col" className={classe} aria-sort={aria}>
        <button
          type="button"
          className={`${styles.ordenar} ${ativa ? styles.ordenarAtivo : ""}`}
          onClick={() => alternar(chave)}
          title={`Ordenar por ${rotulo.toLowerCase()}`}
        >
          {rotulo}
          <FontAwesomeIcon icon={icone} aria-hidden="true" />
        </button>
      </th>
    );
  }

  return (
    <div className={styles.tableScroll} role="region" aria-label={legenda} tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.caption}>{legenda}</caption>
        <thead>
          <tr>
            {cabecalho("posicao", "Posição", styles.colPosicao)}
            {cabecalho("nome", porMotorista ? "Motorista" : "Veículo", styles.colTexto)}
            {porMotorista && (
              <th scope="col" className={`${styles.colTexto} ${styles.colPlaca}`}>
                Veículo
              </th>
            )}
            <th scope="col" className={`${styles.colTexto} ${styles.colDestinos}`}>
              Destinos
            </th>
            {cabecalho("viagens", "Viagens")}
            {cabecalho("resultado", "Rentabilidade")}
            {cabecalho("pontuacao", "Pontuação", styles.colPontuacao)}
          </tr>
        </thead>
        <tbody>
          {linhas.map((item, i) => {
            const destaque = item.posicao <= 3 ? styles[`top${item.posicao}`] : "";
            const nome = porMotorista ? item.motorista : item.veiculo;
            const largura = maiorPontuacao > 0 ? Math.max(0, (item.pontuacao / maiorPontuacao) * 100) : 0;
            const extras = item.destinos.length - MAX_DESTINOS;
            return (
              <tr
                key={`${item.posicao}-${item.motoristaId ?? item.veiculo ?? ""}`}
                className={`${styles.linha} ${destaque}`}
                style={{ "--i": i } as CSSProperties}
              >
                <td className={styles.colPosicao}>
                  <span className={styles.posicao}>
                    {item.posicao <= 3 && <FontAwesomeIcon icon={icons.medal} aria-hidden="true" />}
                    {item.posicao}º
                  </span>
                </td>
                <th scope="row" className={styles.colTexto}>
                  <span className={styles.identidade}>
                    <span className={styles.avatar} aria-hidden="true">
                      {porMotorista ? iniciais(item.motorista) : <FontAwesomeIcon icon={icons.truck} />}
                    </span>
                    <span className={styles.textos}>
                      <span className={porMotorista ? styles.nome : `${styles.nome} ${styles.placaNome}`}>
                        {nome ?? "—"}
                      </span>
                      {/* em telas estreitas a coluna Veículo some e a placa vem sob o nome */}
                      {porMotorista && (
                        <span className={`${styles.placa} ${styles.placaSobNome}`}>{item.veiculo ?? "—"}</span>
                      )}
                    </span>
                  </span>
                </th>
                {porMotorista && (
                  <td className={`${styles.colTexto} ${styles.colPlaca}`}>
                    <span className={styles.placa}>{item.veiculo ?? "—"}</span>
                  </td>
                )}
                <td className={`${styles.colTexto} ${styles.colDestinos}`}>
                  {item.destinos.length === 0 ? (
                    <span className={styles.placa}>—</span>
                  ) : (
                    <span className={styles.destinos} title={item.destinos.join(", ")}>
                      {item.destinos.slice(0, MAX_DESTINOS).map((destino) => (
                        <span key={destino} className={styles.chip}>
                          {destino}
                        </span>
                      ))}
                      {extras > 0 && <span className={styles.chip}>+{extras}</span>}
                    </span>
                  )}
                </td>
                <td>{inteiro.format(item.quantidadeViagens)}</td>
                <td className={item.resultado < 0 ? styles.negativo : undefined}>
                  {moeda.format(item.resultado)}
                </td>
                <td className={styles.colPontuacao}>
                  <span className={styles.pontuacao}>
                    <strong>{decimal2.format(item.pontuacao)}</strong>
                    <span className={styles.barra} aria-hidden="true">
                      <span className={styles.barraPreenchida} style={{ width: `${largura}%` }} />
                    </span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
