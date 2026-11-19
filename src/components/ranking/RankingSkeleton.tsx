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

/** Placeholders dos quatro indicadores enquanto o ranking do filtro atual não chegou. */
export function RankingKpiSkeleton() {
  return (
    <div className={styles.kpis} aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={styles.kpi}>
          <span className={`${styles.bloco} ${styles.kpiTitulo}`} />
          <span className={`${styles.bloco} ${styles.kpiValor}`} />
          <span className={`${styles.bloco} ${styles.kpiTexto}`} />
        </div>
      ))}
    </div>
  );
}
