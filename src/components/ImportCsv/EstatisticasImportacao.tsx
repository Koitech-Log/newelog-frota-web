import type { CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useContagemAnimada } from "../../hooks/useContagemAnimada";
import { inteiro } from "../../utils/formatadores";
import styles from "./EstatisticasImportacao.module.css";

export interface EstatisticaImportacao {
  rotulo: string;
  valor: number;
  tom: "neutro" | "ok" | "erro";
  icone: IconDefinition;
}

function Cartao({ item, indice }: { item: EstatisticaImportacao; indice: number }) {
  const animado = useContagemAnimada(item.valor, 700);

  return (
    <div className={`${styles.cartao} ${styles[item.tom]}`} style={{ "--i": indice } as CSSProperties}>
      <span className={styles.icone} aria-hidden="true">
        <FontAwesomeIcon icon={item.icone} />
      </span>
      <dd className={styles.valor}>
        <span className={styles.somenteLeitor}>{inteiro.format(item.valor)}</span>
        <span aria-hidden="true">{inteiro.format(Math.round(animado))}</span>
      </dd>
      <dt className={styles.rotulo}>{item.rotulo}</dt>
    </div>
  );
}

/** Três números do resultado, com ícone e contagem animada. */
export function EstatisticasImportacao({ itens }: { itens: EstatisticaImportacao[] }) {
  return (
    <dl className={styles.grade}>
      {itens.map((item, i) => (
        <Cartao key={item.rotulo} item={item} indice={i} />
      ))}
    </dl>
  );
}
