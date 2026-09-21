import { useEffect, useState } from "react";
import styles from "./RadialGauge.module.css";

interface RadialGaugeProps {
  percentual: number;
  tamanho?: number;
}

const RAIO = 33;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

function faixaDe(percentual: number): "alta" | "media" | "baixa" {
  if (percentual >= 85) return "alta";
  if (percentual <= 55) return "baixa";
  return "media";
}

export function RadialGauge({ percentual, tamanho = 64 }: RadialGaugeProps) {
  // Começa em 0% e anima até o valor real logo após montar — replica o efeito
  // de "preenchimento" do medidor que existia no protótipo original em JS puro.
  const [percentualAnimado, setPercentualAnimado] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPercentualAnimado(percentual));
    return () => cancelAnimationFrame(id);
  }, [percentual]);

  const offset = CIRCUNFERENCIA - (CIRCUNFERENCIA * percentualAnimado) / 100;
  const faixa = faixaDe(percentual);

  return (
    <div
      className={`${styles.gauge} ${styles[faixa]}`}
      style={{ width: tamanho, height: tamanho }}
      role="img"
      aria-label={`Utilização de ${percentual}%`}
    >
      <svg viewBox="0 0 76 76">
        <circle className={styles.track} cx="38" cy="38" r={RAIO} />
        <circle
          className={styles.fill}
          cx="38"
          cy="38"
          r={RAIO}
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.label}>
        <span className={styles.value}>{percentual}%</span>
        <span className={styles.unit}>uso</span>
      </div>
    </div>
  );
}
