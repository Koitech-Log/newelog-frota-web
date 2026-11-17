import styles from "./RankingSkeleton.module.css";

/** Linhas de espera exibidas enquanto o ranking do filtro atual não chegou. */
export function RankingSkeleton({ linhas = 6 }: { linhas?: number }) {
  return (
    <div className={styles.lista} aria-hidden="true">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className={styles.linha}>
          <span className={`${styles.bloco} ${styles.posicao}`} />
          <span className={`${styles.bloco} ${styles.nome}`} />
          <span className={`${styles.bloco} ${styles.valor}`} />
        </div>
      ))}
    </div>
  );
}
