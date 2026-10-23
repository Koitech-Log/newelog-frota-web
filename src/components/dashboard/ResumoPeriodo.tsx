import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { RentabilidadeMediaGeral } from "../../api/dashboard";
import { decimal1, inteiro, moeda } from "../../utils/formatadores";
import type { Variacao } from "../../utils/variacao";
import { icons } from "../icons";
import { VariacaoBadge } from "./VariacaoBadge";
import styles from "./ResumoPeriodo.module.css";

interface ResumoPeriodoProps {
  nomePeriodo: string;
  geral: RentabilidadeMediaGeral;
  margem: number;
  /** Variação da rentabilidade total frente ao mês anterior (null se não houver base). */
  variacao: Variacao | null;
}

/** Faixa de resumo executivo: o resultado do mês em uma frase, com os números que o explicam. */
export function ResumoPeriodo({ nomePeriodo, geral, margem, variacao }: ResumoPeriodoProps) {
  const semViagens = geral.quantidadeViagens === 0;
  const tom = geral.rentabilidadeTotal < 0 ? styles.negativo : styles.positivo;

  return (
    <section className={styles.faixa} aria-label="Resumo do período">
      <span className={`${styles.icone} ${semViagens ? styles.vazio : ""}`} aria-hidden="true">
        <FontAwesomeIcon icon={semViagens ? icons.calendarDays : icons.invoice} />
      </span>

      <div className={styles.texto}>
        {semViagens ? (
          <>
            <p className={styles.chamada}>Nenhuma viagem registrada em {nomePeriodo}.</p>
            <p className={styles.detalhes}>
              Escolha outro mês ou importe um manifesto para ver os indicadores.
            </p>
          </>
        ) : (
          <>
            <p className={styles.chamada}>
              {geral.rentabilidadeTotal < 0 ? "Prejuízo" : "Resultado"} de{" "}
              <strong className={tom}>{moeda.format(geral.rentabilidadeTotal)}</strong> em{" "}
              {nomePeriodo}
            </p>
            <p className={styles.detalhes}>
              <span>
                <FontAwesomeIcon icon={icons.road} aria-hidden="true" />{" "}
                {inteiro.format(geral.quantidadeViagens)}{" "}
                {geral.quantidadeViagens === 1 ? "viagem" : "viagens"}
              </span>
              <span>
                <FontAwesomeIcon icon={icons.wallet} aria-hidden="true" />{" "}
                {moeda.format(geral.freteTotal)} em fretes
              </span>
              <span>
                <FontAwesomeIcon icon={icons.receipt} aria-hidden="true" />{" "}
                {moeda.format(geral.custoTotal)} em custos
              </span>
              <span>
                <FontAwesomeIcon icon={icons.percent} aria-hidden="true" /> margem de{" "}
                {decimal1.format(margem)}%
              </span>
            </p>
          </>
        )}
      </div>

      {variacao && (
        <div className={styles.comparativo}>
          <VariacaoBadge variacao={variacao} />
          <span>vs. mês anterior</span>
        </div>
      )}
    </section>
  );
}
