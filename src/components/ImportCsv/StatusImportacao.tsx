import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "../icons";
import styles from "./StatusImportacao.module.css";

export type VarianteStatus = "success" | "warning" | "error";

interface StatusImportacaoProps {
  variante: VarianteStatus;
  titulo: string;
  descricao?: string;
  /** Barra de progresso: quantas linhas deram certo, do total lido. */
  progresso?: { valor: number; total: number };
}

const ICONE = { warning: icons.warning, error: icons.error } as const;

/** Faixa principal do resultado da importação: selo animado, título, resumo e barra de aproveitamento. */
export function StatusImportacao({ variante, titulo, descricao, progresso }: StatusImportacaoProps) {
  const pct =
    progresso && progresso.total > 0
      ? Math.round((progresso.valor / progresso.total) * 100)
      : null;

  return (
    <div
      className={`${styles.status} ${styles[variante]}`}
      role={variante === "error" ? "alert" : "status"}
    >
      <span className={styles.selo} aria-hidden="true">
        {variante === "success" ? (
          <svg viewBox="0 0 24 24" className={styles.check}>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        ) : (
          <FontAwesomeIcon icon={ICONE[variante]} />
        )}
      </span>

      <div className={styles.texto}>
        <p className={styles.titulo}>{titulo}</p>
        {descricao && <p className={styles.descricao}>{descricao}</p>}

        {pct !== null && (
          <div className={styles.progresso}>
            <div
              className={styles.trilho}
              role="progressbar"
              aria-label="Linhas importadas"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <span className={styles.barra} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.pct}>{pct}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
