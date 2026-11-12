import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "./icons";
import styles from "./Toast.module.css";

type TipoToast = "success" | "error" | "warning" | "info";

interface ToastProps {
  mensagem: string | null;
  tipo?: TipoToast;
  onFechar: () => void;
}

const DURACAO_MS = 3800;
const SAIDA_MS = 200;

const ICONE: Record<TipoToast, typeof icons.success> = {
  success: icons.success,
  error: icons.error,
  warning: icons.warning,
  info: icons.info,
};

export function Toast({ mensagem, tipo = "success", onFechar }: ToastProps) {
  if (!mensagem) return null;
  // key: uma nova mensagem/tipo remonta o item e reinicia timer e animações
  return <ToastItem key={`${tipo}-${mensagem}`} mensagem={mensagem} tipo={tipo} onFechar={onFechar} />;
}

function ToastItem({ mensagem, tipo, onFechar }: ToastProps & { mensagem: string; tipo: TipoToast }) {
  const [saindo, setSaindo] = useState(false);
  const [pausado, setPausado] = useState(false);

  // Guarda o callback mais recente para o timer não reiniciar a cada render do pai
  const onFecharRef = useRef(onFechar);
  useEffect(() => {
    onFecharRef.current = onFechar;
  }, [onFechar]);

  const restanteRef = useRef(DURACAO_MS);
  const inicioRef = useRef(0);

  const fechar = useCallback(() => {
    setSaindo(true);
    window.setTimeout(() => onFecharRef.current(), SAIDA_MS);
  }, []);

  // Timer com pausa (hover/foco): desconta o tempo já decorrido ao retomar
  useEffect(() => {
    if (pausado) return;
    inicioRef.current = Date.now();
    const id = window.setTimeout(fechar, restanteRef.current);
    return () => {
      window.clearTimeout(id);
      restanteRef.current = Math.max(
        0,
        restanteRef.current - (Date.now() - inicioRef.current),
      );
    };
  }, [pausado, fechar]);

  const urgente = tipo === "error" || tipo === "warning";

  return (
    <div
      className={`${styles.toast} ${styles[tipo]} ${saindo ? styles.saindo : ""}`}
      role={urgente ? "alert" : "status"}
      aria-live={urgente ? "assertive" : "polite"}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <span className={styles.selo} aria-hidden="true">
        <FontAwesomeIcon icon={ICONE[tipo]} />
      </span>
      <span className={styles.texto}>{mensagem}</span>
      <button type="button" className={styles.fechar} onClick={fechar} aria-label="Fechar notificação">
        <FontAwesomeIcon icon={icons.close} />
      </button>
      <span
        className={styles.progresso}
        style={{ animationDuration: `${DURACAO_MS}ms`, animationPlayState: pausado ? "paused" : "running" }}
        aria-hidden="true"
      />
    </div>
  );
}