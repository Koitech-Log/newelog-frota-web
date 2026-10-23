import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import type { Variacao } from "../../utils/variacao";
import styles from "./VariacaoBadge.module.css";

const ICONE = {
  alta: icons.trendUp,
  queda: icons.trendDown,
  estavel: icons.flat,
} as const;

const DESCRICAO = { alta: "em alta", queda: "em queda", estavel: "estável" } as const;

/** Etiqueta de variação (▲/▼) usada nos cartões e no resumo do período. */
export function VariacaoBadge({ variacao, titulo }: { variacao: Variacao; titulo?: string }) {
  return (
    <span className={`${styles.badge} ${styles[variacao.tom]}`} title={titulo}>
      <FontAwesomeIcon icon={ICONE[variacao.direcao]} aria-hidden="true" />
      {variacao.texto}
      <span className={styles.somenteLeitor}> ({DESCRICAO[variacao.direcao]} vs. mês anterior)</span>
    </span>
  );
}
