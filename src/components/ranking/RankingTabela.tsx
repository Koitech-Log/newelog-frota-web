import type { CSSProperties } from "react";
import type { RankingItem, TipoRanking } from "../../api/ranking";
import { inteiro, moeda } from "../../utils/formatadores";
import styles from "./RankingTabela.module.css";

interface RankingTabelaProps {
  tipo: TipoRanking;
  itens: RankingItem[];
  /** Texto para leitores de tela, ex.: "Ranking de motoristas em agosto de 2026". */
  legenda: string;
}

/**
 * Lista do ranking. Exibe os itens na ordem e com a posição devolvidas pela API:
 * nada é reordenado nem renumerado aqui (com busca ativa a posição continua a real).
 */
export function RankingTabela({ tipo, itens, legenda }: RankingTabelaProps) {
  const porMotorista = tipo === "motoristas";

  return (
    <div className={styles.tableScroll} role="region" aria-label={legenda} tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.caption}>{legenda}</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.colPosicao}>
              Posição
            </th>
            {porMotorista && (
              <th scope="col" className={styles.colTexto}>
                Motorista
              </th>
            )}
            <th
              scope="col"
              className={`${styles.colTexto} ${porMotorista ? styles.colPlaca : ""}`}
            >
              Veículo
            </th>
            <th scope="col">Viagens</th>
            <th scope="col">Rentabilidade</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item, i) => (
            <tr
              key={`${item.posicao}-${item.motoristaId ?? item.veiculo ?? ""}`}
              className={styles.linha}
              style={{ "--i": i } as CSSProperties}
            >
              <td className={styles.colPosicao}>
                <span className={styles.posicao}>{item.posicao}º</span>
              </td>
              {porMotorista && (
                <th scope="row" className={styles.colTexto}>
                  <span className={styles.nome}>{item.motorista ?? "—"}</span>
                  {/* em telas estreitas a coluna Veículo some e a placa vem sob o nome */}
                  <span className={`${styles.placa} ${styles.placaSobNome}`}>
                    {item.veiculo ?? "—"}
                  </span>
                </th>
              )}
              {porMotorista ? (
                <td className={`${styles.colTexto} ${styles.colPlaca}`}>
                  <span className={styles.placa}>{item.veiculo ?? "—"}</span>
                </td>
              ) : (
                <th scope="row" className={styles.colTexto}>
                  <span className={styles.placa}>{item.veiculo ?? "—"}</span>
                </th>
              )}
              <td>{inteiro.format(item.quantidadeViagens)}</td>
              <td className={item.resultado < 0 ? styles.negativo : undefined}>
                {moeda.format(item.resultado)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
