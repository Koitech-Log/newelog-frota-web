import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RadialGauge } from "./RadialGauge";
import { icons, iconePorTipoVeiculo } from "./icons";
import type { MotoristaResumo } from "../types/motorista";
import styles from "./DriverCard.module.css";

interface DriverCardProps {
  motorista: MotoristaResumo;
  onSelecionar: (id: number) => void;
  /** Posição na lista — usada para escalonar a animação de entrada. */
  indice?: number;
}

function calcularUtilizacao(m: MotoristaResumo): number {
  const total = m.diasOperacao + m.diasDisponiveis;
  if (total === 0) return 0;
  return Math.round((m.diasOperacao / total) * 100);
}

export function DriverCard({ motorista, onSelecionar, indice = 0 }: DriverCardProps) {
  const utilizacao = calcularUtilizacao(motorista);
  const disponivel = motorista.status === "DISPONIVEL";

  return (
    <button
      type="button"
      className={styles.card}
      style={{ animationDelay: `${Math.min(indice, 12) * 45}ms` }}
      onClick={() => onSelecionar(motorista.id)}
      aria-label={`Ver detalhes de ${motorista.nome}`}
    >
      <div className={styles.main}>
        <div className={styles.top}>
          <div className={styles.identity}>
            <div className={styles.avatar} aria-hidden>
              <FontAwesomeIcon icon={iconePorTipoVeiculo(motorista.tipoVeiculo)} />
            </div>
            <div className={styles.nameBlock}>
              <div className={styles.name}>
                {motorista.nome}
                {!motorista.cadastroValidado && (
                  <span className={styles.badgeNew}>
                    <FontAwesomeIcon icon={icons.userPlus} /> Novo
                  </span>
                )}
              </div>
              <div className={styles.vehicle}>
                #{motorista.placaVeiculo ?? "sem placa"}
                {motorista.tipoVeiculo ? ` · ${motorista.tipoVeiculo}` : ""}
              </div>
            </div>
          </div>
          <span className={`${styles.statusTag} ${disponivel ? styles.disp : styles.ocup}`}>
            {disponivel ? "Disponível" : "Em operação"}
          </span>
        </div>

        <div className={styles.metrics}>
          <div className={styles.metric}>
            <div className={styles.metricValue}>{motorista.totalViagens}</div>
            <div className={styles.metricLabel}>Viagens</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricValue}>{motorista.diasDisponiveis}</div>
            <div className={styles.metricLabel}>Dias livres</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricValue}>{motorista.diasOperacao}</div>
            <div className={styles.metricLabel}>Dias ativos</div>
          </div>
        </div>
      </div>

      <div className={styles.utilizationWrap}>
        <RadialGauge percentual={utilizacao} tamanho={64} />
      </div>
      <FontAwesomeIcon icon={icons.chevronRight} className={styles.chevron} aria-hidden />
    </button>
  );
}
