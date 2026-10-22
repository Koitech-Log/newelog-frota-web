import type { CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useContagemAnimada } from "../../hooks/useContagemAnimada";
import { formatar, type FormatoNumero } from "../../utils/formatadores";
import type { Variacao } from "../../utils/variacao";
import styles from "./KpiCard.module.css";

interface KpiCardProps {
  titulo: string;
  valor: number;
  formato: FormatoNumero;
  descricao: string;
  icone: IconDefinition;
  /** "auto" pinta de verde/vermelho conforme o sinal; "neutro" mantém a cor padrão. */
  tom?: "auto" | "neutro";
  variacao?: Variacao | null;
  /** Detalhe exibido ao passar o mouse na variação (ex.: valor do mês anterior). */
  detalheVariacao?: string;
  /** Posição no grid, usada para escalonar a animação de entrada. */
  indice?: number;
}

const SETA = { alta: "▲", queda: "▼", estavel: "▬" } as const;

export function KpiCard({
  titulo,
  valor,
  formato,
  descricao,
  icone,
  tom = "neutro",
  variacao,
  detalheVariacao,
  indice = 0,
}: KpiCardProps) {
  const animado = useContagemAnimada(valor);
  const classeTom =
    tom === "auto" ? (valor < 0 ? styles.negativo : valor > 0 ? styles.positivo : "") : "";

  return (
    <article className={styles.card} style={{ "--i": indice } as CSSProperties}>
      <div className={styles.topo}>
        <h2 className={styles.titulo}>{titulo}</h2>
        <span className={styles.icone} aria-hidden="true">
          <FontAwesomeIcon icon={icone} />
        </span>
      </div>

      <p className={`${styles.valor} ${classeTom}`}>
        {/* leitores de tela recebem o valor final, sem a contagem intermediária */}
        <span className={styles.somenteLeitor}>{formatar(valor, formato)}</span>
        <span aria-hidden="true">{formatar(animado, formato)}</span>
      </p>

      <div className={styles.linhaVariacao}>
        {variacao && (
          <>
            <span
              className={`${styles.badge} ${styles[variacao.tom]}`}
              title={detalheVariacao}
            >
              <span aria-hidden="true">{SETA[variacao.direcao]}</span> {variacao.texto}
            </span>
            <span className={styles.comparacao}>vs. mês anterior</span>
          </>
        )}
      </div>

      <p className={styles.descricao}>{descricao}</p>
    </article>
  );
}
